import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { DisputeStatus, PackageStatus, PaymentStatus, ProofTier, RoleCode } from '../src/common/domain.enums';
import { PrismaService } from '../src/prisma/prisma.service';

const actor = (id: string, roles: RoleCode[]) => ({
  'x-actor-id': id,
  'x-actor-roles': roles.join(',')
});

describe('Integration 7C backend contract repair', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleRef.createNestApplication();
    app.enableCors({
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type', 'x-actor-id', 'x-actor-roles', 'x-actor-permissions', 'x-correlation-id'],
      exposedHeaders: ['x-correlation-id'],
      optionsSuccessStatus: 204
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows frontend dev CORS preflight for AI provider testing', async () => {
    await request(app.getHttpServer())
      .options('/ai/providers/dev-provider-001/test')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Authorization,Content-Type,x-actor-id,x-actor-roles')
      .expect(204)
      .expect('access-control-allow-origin', 'http://localhost:3000')
      .expect((response) => {
        expect(response.headers['access-control-allow-headers']).toContain('Authorization');
        expect(response.headers['access-control-allow-headers']).toContain('x-actor-roles');
      });
  });

  it('returns clean validation envelopes instead of 500s for invalid contract payloads', async () => {
    await request(app.getHttpServer())
      .post('/orders')
      .set(actor('customer_7c', [RoleCode.CUSTOMER]))
      .send({ customerId: 'cust_7c', merchantId: 'merch_7c' })
      .expect(400)
      .expect(({ body }) => expect(body.error.code).toBe('VALIDATION_FAILED'));

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'superadmin@example.local' })
      .expect(400)
      .expect(({ body }) => expect(body.error.code).toBe('VALIDATION_FAILED'));

    await request(app.getHttpServer())
      .post('/dispatch/assign-driver')
      .set(actor('disponent_7c', [RoleCode.LOGISTIC_DISPONENT]))
      .send({ shipmentId: 'ship_7c' })
      .expect(400)
      .expect(({ body }) => expect(body.error.code).toBe('VALIDATION_FAILED'));
  });

  it('returns ContractMismatch instead of 500 for shipment creation reference failures', async () => {
    const prismaFailure = {
      shipment: {
        create: jest.fn().mockRejectedValue(new Error('Foreign key constraint failed on the field: orderId'))
      }
    };
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaFailure)
      .compile();
    const failingApp = moduleRef.createNestApplication();
    failingApp.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await failingApp.init();

    await request(failingApp.getHttpServer())
      .post('/shipments')
      .set(actor('merchant_7d', [RoleCode.MERCHANT]))
      .send({ orderId: 'ord_missing_7d', barcode: 'PKG-7D' })
      .expect(400)
      .expect(({ body }) => expect(body.error.code).toBe('CONTRACTMISMATCH'));

    await failingApp.close();
  });

  it('keeps repaired workflow endpoints available with dev actor headers', async () => {
    await request(app.getHttpServer())
      .post('/orders/ord_7c/confirm')
      .set(actor('merchant_7c', [RoleCode.MERCHANT]))
      .send({})
      .expect(201)
      .expect(({ body }) => expect(body.status).toBe('booked'));

    await request(app.getHttpServer())
      .post('/warehouse/pick/start')
      .set(actor('warehouse_7c', [RoleCode.WAREHOUSE_STAFF]))
      .send({ packageId: 'pkg_7c' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/warehouse/scan')
      .set(actor('warehouse_7c', [RoleCode.WAREHOUSE_STAFF]))
      .send({ packageId: 'pkg_7c', barcode: 'PKG-7C' })
      .expect(201);
    await request(app.getHttpServer()).post('/warehouse/pack').set(actor('warehouse_7c', [RoleCode.WAREHOUSE_STAFF])).send({ packageId: 'pkg_7c' }).expect(201);
    await request(app.getHttpServer()).post('/warehouse/label').set(actor('warehouse_7c', [RoleCode.WAREHOUSE_STAFF])).send({ packageId: 'pkg_7c' }).expect(201);
    await request(app.getHttpServer()).post('/warehouse/stage').set(actor('warehouse_7c', [RoleCode.WAREHOUSE_STAFF])).send({ packageId: 'pkg_7c' }).expect(201);
    await request(app.getHttpServer()).post('/warehouse/ready-for-dispatch').set(actor('warehouse_manager_7c', [RoleCode.WAREHOUSE_MANAGER])).send({ packageId: 'pkg_7c' }).expect(201);

    await request(app.getHttpServer())
      .post('/dispatch/assign-driver')
      .set(actor('disponent_7c', [RoleCode.LOGISTIC_DISPONENT]))
      .send({ shipmentId: 'ship_7c', driverId: 'driver_7c', packageStatus: PackageStatus.READY_FOR_DISPATCH })
      .expect(201);

    await request(app.getHttpServer())
      .post('/drivers/pickup/ship_7c/complete')
      .set(actor('driver_7c', [RoleCode.DRIVER]))
      .send({ packageScanCode: 'PKG-7C' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/shipments/ship_7c/deliver')
      .set(actor('driver_7c', [RoleCode.DRIVER]))
      .send({ tier: ProofTier.LOW_VALUE, gps: { latitude: 51.43, longitude: 6.76, withinTolerance: true }, otp: '123456' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/drivers/delivery/ship_7c/complete')
      .set({ 'x-actor-id': 'driver_7c', 'x-actor-roles': '["driver"]' })
      .send({ tier: ProofTier.LOW_VALUE, gps: { lat: 51.43, lng: 6.76, withinTolerance: true }, otp: '123456' })
      .expect(201);
  });

  it('covers approvals, compliance-safe AI provider testing, and auth session flows', async () => {
    await request(app.getHttpServer())
      .post('/approvals/refunds/apr_refund_7c/approve')
      .set(actor('finance_7c', [RoleCode.FINANCE_ADMIN]))
      .send({ comment: 'Approved for 7C contract test.' })
      .expect(201)
      .expect(({ body }) => expect(body.decision).toBe('approved'));

    await request(app.getHttpServer())
      .post('/ai/approvals/apr_ai_7c/approve')
      .set(actor('compliance_7c', [RoleCode.COMPLIANCE_ADMIN]))
      .send({ comment: 'AI action approved; no live action executed.' })
      .expect(201)
      .expect(({ body }) => expect(body.liveActionExecuted).toBe(false));

    await request(app.getHttpServer())
      .post('/ai/providers/dev-provider-001/test')
      .set(actor('compliance_7c', [RoleCode.COMPLIANCE_ADMIN]))
      .send({ model: 'mock-model', prompt: 'ping' })
      .expect(201)
      .expect(({ body }) => expect(body.liveConnection).toBe(false));

    await request(app.getHttpServer())
      .post('/escrow/release')
      .set(actor('finance_7c', [RoleCode.FINANCE_ADMIN]))
      .send({
        accountId: 'escrow_7c',
        shipmentId: 'ship_7c',
        amount: 25,
        currency: 'EUR',
        proofAccepted: true,
        disputeStatus: DisputeStatus.NONE,
        settlementWindowPassed: true,
        paymentStatus: PaymentStatus.HELD_IN_ESCROW,
        actorRoles: [RoleCode.FINANCE_ADMIN]
      })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'superadmin@example.local', password: 'ChangeMe-Local-Only-123!' })
      .expect(201);
    const setup = await request(app.getHttpServer()).post('/auth/2fa/setup').set('Authorization', `Bearer ${login.body.accessToken}`).send({}).expect(201);
    await request(app.getHttpServer())
      .post('/auth/2fa/verify')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({ challengeId: setup.body.challengeId, code: '000000' })
      .expect(201);
  });
});
