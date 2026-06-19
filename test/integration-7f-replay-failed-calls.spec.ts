import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import { join } from 'path';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

type FailedCall = {
  id: string;
  class: 'dto' | 'rbac';
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'GET' | 'OPTIONS';
  endpoint: string;
  headers: Record<string, string>;
  context: {
    actorId: string;
    roles: string[];
    permissions: string[];
  };
  body?: Record<string, unknown>;
  expectedStatus: number;
  dto?: string;
};

type FailedCallFixture = {
  summary: {
    reported400: number;
    reported403: number;
    expected400After7F: number;
    expected403After7F: number;
  };
  calls: FailedCall[];
};

const fixture = JSON.parse(
  readFileSync(join(__dirname, 'fixtures/integration-7e-failed-calls.json'), 'utf8')
) as FailedCallFixture;

describe('Integration 7F contract replay failed-call elimination', () => {
  let app: INestApplication;
  let openapi: OpenAPIObject;

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

    openapi = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('AI Agentic Logistics OS API')
        .setVersion('0.1.0')
        .addBearerAuth()
        .build()
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('imports the reported 28 DTO and 5 RBAC failed calls as a backend replay fixture', () => {
    expect(fixture.summary.reported400).toBe(28);
    expect(fixture.summary.reported403).toBe(5);
    expect(fixture.calls.filter((call) => call.class === 'dto')).toHaveLength(28);
    expect(fixture.calls.filter((call) => call.class === 'rbac')).toHaveLength(5);
  });

  it('keeps frontend payload keys represented in DTO-backed OpenAPI request schemas', () => {
    for (const call of fixture.calls.filter((entry) => entry.class === 'dto')) {
      const schema = requestSchemaFor(call);
      expect(schema).toBeDefined();
      const body = call.body ?? {};
      expectPayloadKeysInSchema(call.id, body, schema);
    }
  });

  it('replays every failed frontend call without undocumented 400 or 403 responses', async () => {
    const failures: Array<{ id: string; status: number; body: unknown }> = [];

    for (const call of fixture.calls) {
      const response = await dispatch(call);
      if (response.status === 400 || response.status === 403 || response.status >= 500) {
        failures.push({ id: call.id, status: response.status, body: response.body });
      }
      expect(response.status).toBe(call.expectedStatus);
    }

    expect(failures).toEqual([]);
  });

  it('preserves RBAC denial for actors outside the route matrix', async () => {
    await request(app.getHttpServer())
      .post('/dispatch/assign-driver')
      .set({
        'x-actor-id': 'customer_7f_denied',
        'x-actor-roles': 'customer'
      })
      .send({ shipmentId: 'ship_7f', driverId: 'driver_7f' })
      .expect(403)
      .expect(({ body }) => expect(body.error.code).toBe('RBAC_PERMISSION_DENIED'));
  });

  function dispatch(call: FailedCall) {
    const testRequest = request(app.getHttpServer());
    const method = call.method.toLowerCase() as 'post' | 'put' | 'patch' | 'delete' | 'get' | 'options';
    const req = testRequest[method](call.endpoint).set(call.headers);
    return call.body === undefined ? req : req.send(call.body);
  }

  function requestSchemaFor(call: FailedCall): Record<string, unknown> | undefined {
    const path = openapi.paths[openApiPath(call.endpoint)];
    const operation = path?.[call.method.toLowerCase() as keyof typeof path] as any;
    const schema = operation?.requestBody?.content?.['application/json']?.schema;
    return resolveSchema(schema);
  }

  function openApiPath(endpoint: string) {
    return endpoint
      .split('/')
      .map((part) => {
        if (/^(ord|ship|ret|apr|dev-provider|PKG-|pkg|driver)_/.test(part) || part === 'dev-provider-001') return `{${pathParamFor(endpoint, part)}}`;
        return part;
      })
      .join('/');
  }

  function pathParamFor(endpoint: string, _part: string) {
    if (endpoint.includes('/providers/')) return 'id';
    if (endpoint.includes('/pickup/') || endpoint.includes('/delivery/')) return 'shipmentId';
    if (endpoint.includes('/refunds/')) return 'id';
    return 'id';
  }

  function resolveSchema(schema: any): Record<string, unknown> | undefined {
    if (!schema) return undefined;
    if (schema.$ref) {
      const name = String(schema.$ref).replace('#/components/schemas/', '');
      return openapi.components?.schemas?.[name] as Record<string, unknown> | undefined;
    }
    return schema;
  }

  function expectPayloadKeysInSchema(callId: string, payload: Record<string, unknown>, schema: Record<string, unknown> | undefined) {
    const properties = (schema?.properties ?? {}) as Record<string, unknown>;
    for (const [key, value] of Object.entries(payload)) {
      expect(Object.keys(properties)).toContain(key);
      if (Array.isArray(value) && value.length && typeof value[0] === 'object' && value[0] !== null) {
        const property = properties[key] as { items?: unknown };
        expectPayloadKeysInSchema(`${callId}.${key}[]`, value[0] as Record<string, unknown>, resolveSchema(property.items));
      }
      if (!Array.isArray(value) && value && typeof value === 'object') {
        const property = properties[key] as Record<string, unknown>;
        const nestedSchema = resolveSchema(property);
        if (nestedSchema?.properties) {
          expectPayloadKeysInSchema(`${callId}.${key}`, value as Record<string, unknown>, nestedSchema);
        }
      }
    }
  }
});
