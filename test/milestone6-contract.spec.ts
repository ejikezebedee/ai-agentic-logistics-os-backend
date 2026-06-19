import { readFileSync } from 'fs';
import { join } from 'path';
import { API_VERSION, FRONTEND_CRITICAL_ENDPOINTS } from '../src/common/api-version';
import { AiRiskLevel, ApprovalStatus, DisputeStatus, OrderStatus, PackageStatus, PaymentStatus, ReturnStatus, RoleCode, ShipmentStatus } from '../src/common/domain.enums';
import { ROLE_PERMISSIONS } from '../src/modules/rbac/permission-map';

type OpenApiDocument = {
  info: { version: string };
  paths: Record<string, unknown>;
  components?: { schemas?: Record<string, unknown> };
};

describe('milestone 6 release-candidate API contract', () => {
  let openapi: OpenApiDocument;

  beforeAll(() => {
    openapi = JSON.parse(readFileSync(join(process.cwd(), 'docs', 'openapi', 'openapi.json'), 'utf8')) as OpenApiDocument;
  });

  it('keeps the OpenAPI export parseable and version-marked', () => {
    expect(openapi.info.version).toBe(API_VERSION);
    expect(Object.keys(openapi.paths).length).toBeGreaterThanOrEqual(90);
  });

  it('documents required endpoint groups for frontend integration', () => {
    const groups = ['/auth', '/orders', '/warehouse', '/disponent', '/driver', '/tracking', '/escrow', '/payments', '/ledger', '/ai', '/approvals', '/provider-adapters', '/meta'];
    for (const group of groups) {
      expect(Object.keys(openapi.paths).some((path) => path.startsWith(group))).toBe(true);
    }
  });

  it('documents frontend-critical endpoints in the frozen contract list', () => {
    for (const endpoint of FRONTEND_CRITICAL_ENDPOINTS) {
      expect(openapi.paths[endpoint]).toBeDefined();
    }
  });

  it('keeps DTO and status enum references available to frontend clients', () => {
    expect(Object.values(RoleCode)).toContain('logistic_disponent');
    expect(Object.values(OrderStatus)).toContain('ready_for_dispatch');
    expect(Object.values(ShipmentStatus)).toContain('delivered');
    expect(Object.values(PackageStatus)).toContain('ready_for_dispatch');
    expect(Object.values(PaymentStatus)).toContain('held_in_escrow');
    expect(Object.values(DisputeStatus)).toContain('opened');
    expect(Object.values(ReturnStatus)).toContain('refund_completed');
    expect(Object.values(AiRiskLevel)).toContain('L3_HIGH');
    expect(Object.values(ApprovalStatus)).toContain('approved');
  });

  it('keeps required role-protected endpoint ownership documented', () => {
    expect(ROLE_PERMISSIONS[RoleCode.LOGISTIC_DISPONENT]).toContain('disponent:assign_driver');
    expect(ROLE_PERMISSIONS[RoleCode.DRIVER]).toContain('delivery:complete');
    expect(ROLE_PERMISSIONS[RoleCode.FINANCE_ADMIN]).toContain('escrow:release');
    expect(ROLE_PERMISSIONS[RoleCode.AI_AGENT]).toContain('ai:request_approval');
  });
});
