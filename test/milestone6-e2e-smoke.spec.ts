import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DisputeStatus, PackageStatus, PaymentStatus, ProofTier, RoleCode } from '../src/common/domain.enums';
import { PrismaService } from '../src/prisma/prisma.service';

type SeedFixture = {
  customer: { id: string };
  merchant: { id: string };
  sku: { id: string };
  shipment: { id: string; packages: Array<{ id: string }> };
  driverUser: { id: string };
  disponentUser: { id: string };
  payment: { id: string; escrowAccount?: { id: string } | null };
};

const actor = (id: string, roles: RoleCode[]) => ({
  'x-actor-id': id,
  'x-actor-roles': roles.join(',')
});

const describePostgres = process.env.DATABASE_URL ? describe : describe.skip;

describePostgres('milestone 6 disposable PostgreSQL E2E smoke', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fixture: SeedFixture;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
    fixture = await loadFixture(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('supports auth login, refresh, session list, and logout', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'superadmin@example.local', password: 'ChangeMe-Local-Only-123!' })
      .expect(201);

    expect(login.body).toMatchObject({ tokenType: 'Bearer', expiresInSeconds: 900 });
    expect(login.body.refreshToken).toBeDefined();

    const refresh = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(201);

    await request(app.getHttpServer())
      .get('/auth/sessions')
      .set('Authorization', `Bearer ${refresh.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => expect(Array.isArray(body.sessions)).toBe(true));

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${refresh.body.accessToken}`)
      .send({ refreshToken: refresh.body.refreshToken })
      .expect(201);
  });

  it('keeps frontend-critical workflow response shapes stable', async () => {
    const order = await request(app.getHttpServer())
      .post('/orders')
      .set(actor('customer_frontend_smoke', [RoleCode.CUSTOMER]))
      .send({
        customerId: fixture.customer.id,
        merchantId: fixture.merchant.id,
        items: [{ skuId: fixture.sku.id, quantity: 1, unitPrice: 149 }]
      })
      .expect(201);
    expect(order.body).toMatchObject({ customerId: fixture.customer.id, merchantId: fixture.merchant.id, status: 'draft' });

    const packageId = fixture.shipment.packages[0].id;
    await request(app.getHttpServer()).post('/warehouse/pick/start').set(actor('warehouse_smoke', [RoleCode.WAREHOUSE_STAFF])).send({ packageId }).expect(201);
    await request(app.getHttpServer()).post('/warehouse/scan').set(actor('warehouse_smoke', [RoleCode.WAREHOUSE_STAFF])).send({ packageId, barcode: 'PKG-M6' }).expect(201);
    await request(app.getHttpServer()).post('/warehouse/pack').set(actor('warehouse_smoke', [RoleCode.WAREHOUSE_STAFF])).send({ packageId }).expect(201);
    await request(app.getHttpServer()).post('/warehouse/label').set(actor('warehouse_smoke', [RoleCode.WAREHOUSE_STAFF])).send({ packageId }).expect(201);
    await request(app.getHttpServer()).post('/warehouse/stage').set(actor('warehouse_smoke', [RoleCode.WAREHOUSE_STAFF])).send({ packageId }).expect(201);
    const ready = await request(app.getHttpServer()).post('/warehouse/ready-for-dispatch').set(actor('warehouse_manager_smoke', [RoleCode.WAREHOUSE_MANAGER])).send({ packageId }).expect(201);
    expect(ready.body).toMatchObject({ packageId, status: PackageStatus.READY_FOR_DISPATCH });

    const tour = await request(app.getHttpServer())
      .post('/disponent/tour-plans')
      .set(actor(fixture.disponentUser.id, [RoleCode.LOGISTIC_DISPONENT]))
      .send({ disponentId: fixture.disponentUser.id, routeSummary: { stops: ['WH-DUS-01', 'Customer'] } })
      .expect(201);
    expect(tour.body.id).toBeDefined();
    await request(app.getHttpServer()).post(`/disponent/tour-plans/${tour.body.id}/approve`).set(actor(fixture.disponentUser.id, [RoleCode.LOGISTIC_DISPONENT])).send({}).expect(201);

    const assignment = await request(app.getHttpServer())
      .post('/disponent/assign-driver')
      .set(actor(fixture.disponentUser.id, [RoleCode.LOGISTIC_DISPONENT]))
      .send({ shipmentId: fixture.shipment.id, driverId: fixture.driverUser.id, packageStatus: PackageStatus.READY_FOR_DISPATCH })
      .expect(201);
    expect(assignment.body).toMatchObject({ shipmentId: fixture.shipment.id, driverId: fixture.driverUser.id, status: 'assigned' });

    await request(app.getHttpServer())
      .post(`/driver/pickup/${fixture.shipment.id}/complete`)
      .set(actor(fixture.driverUser.id, [RoleCode.DRIVER]))
      .send({ packageScanCode: 'PKG-M6', photoObjectKey: 'proof/m6-pickup.jpg' })
      .expect(201);

    const delivery = await request(app.getHttpServer())
      .post(`/driver/delivery/${fixture.shipment.id}/complete`)
      .set(actor(fixture.driverUser.id, [RoleCode.DRIVER]))
      .send({
        tier: ProofTier.LOW_VALUE,
        gps: { latitude: 51.4344, longitude: 6.7623, withinTolerance: true },
        otp: '123456',
        photoObjectKey: 'proof/m6-delivery.jpg'
      })
      .expect(201);
    expect(delivery.body).toMatchObject({ shipmentId: fixture.shipment.id, status: 'delivered', proofAccepted: true });

    const tracking = await request(app.getHttpServer())
      .get(`/tracking/${fixture.shipment.id}`)
      .set(actor('support_smoke', [RoleCode.SUPPORT_AGENT]))
      .expect(200);
    expect(Array.isArray(tracking.body)).toBe(true);
  });

  it('blocks disputed escrow release and creates refund ledger correction shape', async () => {
    await request(app.getHttpServer())
      .post('/escrow/release')
      .set(actor('finance_smoke', [RoleCode.FINANCE_ADMIN]))
      .send({
        accountId: fixture.payment.escrowAccount?.id ?? 'escrow_missing',
        shipmentId: fixture.shipment.id,
        amount: 149,
        currency: 'EUR',
        proofAccepted: true,
        disputeStatus: DisputeStatus.OPENED,
        settlementWindowPassed: true,
        paymentStatus: PaymentStatus.HELD_IN_ESCROW,
        actorRoles: [RoleCode.FINANCE_ADMIN]
      })
      .expect(400)
      .expect(({ body }) => expect(body.error.code).toBe('BAD_REQUEST'));

    const refund = await request(app.getHttpServer())
      .post('/payments/refunds')
      .set(actor('finance_smoke', [RoleCode.FINANCE_ADMIN]))
      .send({
        paymentId: fixture.payment.id,
        accountId: fixture.payment.escrowAccount?.id ?? 'escrow_missing',
        amount: 20,
        currency: 'EUR',
        reason: 'return approved'
      })
      .expect(201);
    expect(refund.body).toMatchObject({ type: 'refund', referenceType: 'payment', referenceId: fixture.payment.id });
  });

  it('gates high-risk AI recommendations and blocks prohibited AI actions', async () => {
    await request(app.getHttpServer())
      .post('/ai/finance/refund-recommendation')
      .set(actor('ai_smoke', [RoleCode.AI_AGENT]))
      .send({ paymentId: fixture.payment.id, approvalCount: 0 })
      .expect(403)
      .expect(({ body }) => expect(body.error.code).toBe('RBAC_PERMISSION_DENIED'));

    await request(app.getHttpServer())
      .post('/ai/actions/authorize')
      .set(actor('ai_smoke', [RoleCode.AI_AGENT]))
      .send({
        agentCode: 'ai_compliance_agent',
        requestedAction: 'delete audit logs',
        riskLevel: 'L5_PROHIBITED',
        actorRoles: [RoleCode.AI_AGENT],
        approvalCount: 99
      })
      .expect(403)
      .expect(({ body }) => expect(body.error.code).toBe('RBAC_PERMISSION_DENIED'));
  });

  it('exposes version and contract metadata for Codey/frontend', async () => {
    await request(app.getHttpServer())
      .get('/meta/version')
      .expect(200)
      .expect(({ body }) => expect(body).toMatchObject({ apiVersion: '0.1.0-rc.1', contractStatus: 'release_candidate' }));
    await request(app.getHttpServer())
      .get('/meta/contract')
      .expect(200)
      .expect(({ body }) => expect(body.frontendCriticalEndpoints).toContain('/auth/login'));
  });
});

async function loadFixture(prisma: PrismaService): Promise<SeedFixture> {
  const customer = await prisma.customer.findFirstOrThrow();
  const merchant = await prisma.merchant.findFirstOrThrow();
  const sku = await prisma.sku.findFirstOrThrow();
  const shipment = await prisma.shipment.findFirstOrThrow({ include: { packages: true } });
  const driverUser = await prisma.user.findFirstOrThrow({ where: { roles: { some: { role: { code: 'driver' } } } } });
  const disponentUser = await prisma.user.findFirstOrThrow({ where: { roles: { some: { role: { code: 'logistic_disponent' } } } } });
  const payment = await prisma.payment.findFirstOrThrow({ include: { escrowAccount: true } });
  return { customer, merchant, sku, shipment, driverUser, disponentUser, payment };
}
