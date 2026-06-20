import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { readFileSync } from 'fs';
import { join } from 'path';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type RerunFailedCall = {
  index: number;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'GET' | 'OPTIONS';
  endpoint: string;
  requestHeadersRedacted: Record<string, string>;
  requestBody?: Record<string, unknown>;
  actualStatus: number;
  failureCategory: string;
};

type RerunFixture = {
  totalFailedCalls: number;
  counts: Record<string, number>;
  failedCalls: RerunFailedCall[];
};

const fixture = JSON.parse(
  readFileSync(join(__dirname, 'fixtures/integration-7g-rerun-failed-calls.json'), 'utf8')
) as RerunFixture;

describe('Integration 7G rerun failure replay', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(createRejectingPrisma())
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

  it('captures the exact 17-call public 7G rerun failure fixture', () => {
    expect(fixture.totalFailedCalls).toBe(17);
    expect(fixture.failedCalls).toHaveLength(17);
    expect(fixture.counts['DTO/body mismatch']).toBe(10);
    expect(fixture.counts['RBAC/dev actor mismatch']).toBe(7);
  });

  it('replays all 17 failed calls without undocumented 400, 401, 403, or 500 responses', async () => {
    const failures: Array<{ index: number; endpoint: string; status: number; body: unknown }> = [];

    for (const call of fixture.failedCalls) {
      const response = await dispatch(call);
      if ([400, 401, 403].includes(response.status) || response.status >= 500) {
        failures.push({ index: call.index, endpoint: call.endpoint, status: response.status, body: response.body });
      }
    }

    expect(failures).toEqual([]);
  });

  function dispatch(call: RerunFailedCall) {
    const testRequest = request(app.getHttpServer());
    const method = call.method.toLowerCase() as 'post' | 'put' | 'patch' | 'delete' | 'get' | 'options';
    const headers = replayHeaders(call.requestHeadersRedacted);
    const req = testRequest[method](call.endpoint).set(headers);
    return call.requestBody === undefined ? req : req.send(call.requestBody);
  }
});

function replayHeaders(headers: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(headers).filter(([key]) => ['content-type', 'x-actor-id', 'x-actor-roles', 'x-actor-permissions'].includes(key.toLowerCase()))
  );
}

function createRejectingPrisma() {
  const reject = jest.fn().mockRejectedValue(new Error('safe dev replay missing relational fixture'));
  const resolveNull = jest.fn().mockResolvedValue(null);
  const resolveList = jest.fn().mockResolvedValue([]);
  const resolveObject = jest.fn().mockResolvedValue({});
  return {
    user: { findUnique: resolveNull },
    order: { create: reject, update: reject },
    return: { create: reject, update: reject, findUnique: resolveNull },
    shipment: { create: reject, update: resolveObject, findUnique: resolveNull },
    dispatchAssignment: {
      create: reject,
      update: reject,
      findMany: resolveList,
      findUnique: resolveNull
    },
    package: { update: reject },
    packageEvent: { create: reject },
    disputeEvidence: { create: jest.fn().mockResolvedValue({}) },
    dispute: { update: jest.fn().mockResolvedValue({}) },
    pickupAttempt: { create: resolveObject },
    deliveryAttempt: { create: resolveObject },
    proofOfDelivery: { upsert: resolveObject },
    trackingEvent: { create: resolveObject },
    twoFactorChallenge: { findFirst: resolveNull, update: reject, create: reject },
    $transaction: jest.fn().mockRejectedValue(new Error('safe dev replay transaction fixture unavailable'))
  };
}
