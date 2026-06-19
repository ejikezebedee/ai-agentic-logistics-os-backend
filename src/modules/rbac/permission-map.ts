import { RoleCode } from '../../common/domain.enums';

export const ROLE_PERMISSIONS: Record<RoleCode, string[]> = {
  [RoleCode.CUSTOMER]: [
    'orders:create',
    'orders:read:own',
    'returns:create',
    'disputes:create',
    'tracking:read:own'
  ],
  [RoleCode.MERCHANT]: [
    'orders:read:merchant',
    'shipments:prepare',
    'warehouse:handoff',
    'inventory:manage:own'
  ],
  [RoleCode.SHIPPER]: ['shipments:read', 'shipments:update_operational'],
  [RoleCode.WAREHOUSE_STAFF]: ['warehouse:pick', 'warehouse:scan', 'warehouse:pack', 'packages:stage'],
  [RoleCode.WAREHOUSE_MANAGER]: ['warehouse:*', 'inventory:*', 'packages:ready_for_dispatch'],
  [RoleCode.DRIVER]: ['driver:jobs', 'pickup:complete', 'delivery:attempt', 'delivery:complete', 'driver:location'],
  [RoleCode.FLEET_MANAGER]: ['fleet:*', 'drivers:assignable', 'vehicles:manage'],
  [RoleCode.CARRIER]: ['carrier:jobs', 'carrier:assignments'],
  [RoleCode.FREIGHT_FORWARDER]: ['routes:international', 'carrier:compare', 'shipments:handover'],
  [RoleCode.LOGISTIC_DISPONENT]: [
    'disponent:queue',
    'disponent:tour_plan',
    'disponent:assign_driver',
    'disponent:assign_vehicle',
    'disponent:assign_carrier',
    'disponent:route_correct',
    'disponent:exceptions',
    'disponent:live_monitor',
    'approvals:operational'
  ],
  [RoleCode.SUPPORT_AGENT]: ['support:cases', 'disputes:evidence', 'notifications:send'],
  [RoleCode.FINANCE_ADMIN]: [
    'payments:read',
    'escrow:release',
    'refunds:approve',
    'payouts:approve',
    'ledger:read',
    'finance_rules:manage'
  ],
  [RoleCode.COMPLIANCE_ADMIN]: ['compliance:*', 'audit:read', 'security_events:read', 'privacy:export'],
  [RoleCode.SUPER_ADMIN]: ['*'],
  [RoleCode.AI_AGENT]: ['ai:recommend', 'ai:execute_l1', 'ai:request_approval']
};

export const DISPONENT_FORBIDDEN_PERMISSIONS = [
  'ledger:edit',
  'escrow:release_disputed',
  'roles:change',
  'audit:delete',
  'users:delete',
  'finance_rules:manage'
];
