import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { RoleCode } from '../src/common/domain.enums';
import { PrismaService } from '../src/prisma/prisma.service';

const actor = (id: string, roles: string[], permissions: string[] = []) => ({
  'x-actor-id': id,
  'x-actor-roles': roles.join(','),
  'x-actor-permissions': permissions.join(',')
});

describe('Integration 7E DTO and RBAC failed-call elimination', () => {
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

  it('accepts frontend DTO aliases across the 7D failed workflow endpoints', async () => {
    await request(app.getHttpServer())
      .post('/orders')
      .set(actor('merchant_7e', [RoleCode.MERCHANT]))
      .send({
        customerId: 'cust_7e',
        merchantId: 'merch_7e',
        currency: 'EUR',
        workflowId: 'frontend-order-create',
        items: [{ productId: 'sku_7e', qty: '2', price: '12.5', frontendAction: 'create-order' }]
      })
      .expect(201)
      .expect(({ body }) => expect(body.items[0].skuId).toBe('sku_7e'));

    await request(app.getHttpServer())
      .post('/shipments')
      .set(actor('merchant_7e', [RoleCode.MERCHANT]))
      .send({ referenceId: 'ord_7e', barcode: 'PKG-7E', origin: { city: 'Duisburg' }, frontendAction: 'create-shipment' })
      .expect(201)
      .expect(({ body }) => expect(body.orderId).toBe('ord_7e'));

    await request(app.getHttpServer())
      .post('/returns')
      .set(actor('cust_7e', [RoleCode.CUSTOMER]))
      .send({ orderId: 'ord_7e', shipmentId: 'ship_7e', reason: 'damaged', frontendAction: 'request-return' })
      .expect(201)
      .expect(({ body }) => expect(body.customerId).toBe('cust_7e'));

    await request(app.getHttpServer())
      .post('/returns/ret_7e/status')
      .set(actor('support_7e', ['support']))
      .send({ status: 'return_approved', comment: 'approved by support', frontendAction: 'return-status' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/warehouse/pick/start')
      .set(actor('wh_7e', ['warehouse_operator']))
      .send({ barcode: 'PKG-7E', workflow: 'warehouse-pick' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/dispatch/assign-driver')
      .set(actor('disp_7e', ['dispatcher']))
      .send({ packageId: 'ship_7e', assignedDriverId: 'driver_7e', frontendAction: 'assign-driver' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/drivers/pickup/ship_7e/complete')
      .set(actor('driver_7e', [RoleCode.DRIVER]))
      .send({ barcode: 'PKG-7E', photoUrl: 'mock://pickup.jpg', workflowId: 'driver-pickup' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/drivers/delivery/ship_7e/complete')
      .set(actor('driver_7e', [RoleCode.DRIVER]))
      .send({ location: { lat: '51.43', lng: '6.76', withinTolerance: true }, barcode: 'PKG-7E', photoUrl: 'mock://delivery.jpg' })
      .expect(201);
  });

  it('honors role aliases and explicit permissions without weakening denied role boundaries', async () => {
    await request(app.getHttpServer())
      .post('/approvals/refunds/apr_refund_7e/approve')
      .set(actor('finance_7e', ['finance_manager']))
      .send({ note: 'approve refund', frontendAction: 'refund-approval' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/ai/providers/dev-provider-001/test')
      .set(actor('compliance_7e', [], ['compliance:*']))
      .send({ model: 'mock-model', prompt: 'ping', operationId: 'AiController_testProvider' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/dispatch/assign-driver')
      .set(actor('customer_7e', [RoleCode.CUSTOMER]))
      .send({ shipmentId: 'ship_7e', driverId: 'driver_7e' })
      .expect(403)
      .expect(({ body }) => expect(body.error.code).toBe('RBAC_PERMISSION_DENIED'));
  });

  it('keeps invalid payloads as clean 400 ContractMismatch responses, not 500s', async () => {
    await request(app.getHttpServer())
      .post('/shipments')
      .set(actor('merchant_7e', [RoleCode.MERCHANT]))
      .send({ barcode: 'PKG-7E' })
      .expect(400)
      .expect(({ body }) => expect(body.error.code).toBe('CONTRACTMISMATCH'));

    await request(app.getHttpServer())
      .post('/dispatch/assign-driver')
      .set(actor('disp_7e', ['dispatcher']))
      .send({ shipmentId: 'ship_7e' })
      .expect(400)
      .expect(({ body }) => expect(body.error.code).toBe('VALIDATION_FAILED'));
  });
});
