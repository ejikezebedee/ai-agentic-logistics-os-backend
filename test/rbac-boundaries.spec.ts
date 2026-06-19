import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { CoreModule } from '../src/core.module';
import { JwtAuthGuard } from '../src/common/jwt-auth.guard';
import { RolesGuard } from '../src/common/roles.guard';
import { RoleCode } from '../src/common/domain.enums';
import { PrismaService } from '../src/prisma/prisma.service';

function actor(role: RoleCode) {
  return { 'x-actor-id': `${role}_actor`, 'x-actor-roles': role };
}

describe('endpoint RBAC boundaries', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CoreModule],
      providers: [
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard }
      ]
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects protected endpoints without actor headers', async () => {
    await request(app.getHttpServer()).get('/roles').expect(403);
  });

  it('allows Logistic Disponent operational access but blocks ledger access', async () => {
    await request(app.getHttpServer()).get('/disponent/queue').set(actor(RoleCode.LOGISTIC_DISPONENT)).expect(200);
    await request(app.getHttpServer()).get('/ledger').set(actor(RoleCode.LOGISTIC_DISPONENT)).expect(403);
  });

  it('enforces warehouse staff and driver operational boundaries', async () => {
    await request(app.getHttpServer()).post('/warehouse/pick/start').set(actor(RoleCode.WAREHOUSE_STAFF)).send({ packageId: 'pkg_e2e' }).expect(201);
    await request(app.getHttpServer()).get('/driver/jobs').set(actor(RoleCode.DRIVER)).expect(200);
    await request(app.getHttpServer()).get('/disponent/queue').set(actor(RoleCode.DRIVER)).expect(403);
  });

  it('allows finance admin to request escrow release but policy blocks active disputes', async () => {
    await request(app.getHttpServer())
      .post('/escrow/release')
      .set(actor(RoleCode.FINANCE_ADMIN))
      .send({
        accountId: 'escrow_1',
        shipmentId: 'ship_1',
        amount: 10,
        currency: 'EUR',
        proofAccepted: true,
        disputeStatus: 'opened',
        settlementWindowPassed: true,
        paymentStatus: 'held_in_escrow',
        actorRoles: [RoleCode.FINANCE_ADMIN]
      })
      .expect(400);
  });

  it('separates support and compliance access', async () => {
    await request(app.getHttpServer()).post('/disputes/evidence').set(actor(RoleCode.SUPPORT_AGENT)).send({ disputeId: 'disp_1', evidenceType: 'photo' }).expect(201);
    await request(app.getHttpServer()).get('/audit').set(actor(RoleCode.SUPPORT_AGENT)).expect(403);
    await request(app.getHttpServer()).get('/audit').set(actor(RoleCode.COMPLIANCE_ADMIN)).expect(200);
  });

  it('allows super admin broad contract access', async () => {
    await request(app.getHttpServer()).get('/roles').set(actor(RoleCode.SUPER_ADMIN)).expect(200);
    await request(app.getHttpServer()).get('/analytics').set(actor(RoleCode.SUPER_ADMIN)).expect(200);
  });

  it('keeps AI prohibited actions blocked at API boundary', async () => {
    await request(app.getHttpServer())
      .post('/ai/actions/authorize')
      .set(actor(RoleCode.AI_AGENT))
      .send({
        agentCode: 'ai_compliance_agent',
        requestedAction: 'delete audit logs',
        riskLevel: 'L5_PROHIBITED',
        actorRoles: [RoleCode.AI_AGENT],
        approvalCount: 99
      })
      .expect(403);
  });
});
