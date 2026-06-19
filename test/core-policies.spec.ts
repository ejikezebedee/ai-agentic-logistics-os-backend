import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { AiRiskLevel, DisputeStatus, LedgerEntryType, OrderStatus, PackageStatus, PaymentStatus, ProofTier, RoleCode, ShipmentStatus } from '../src/common/domain.enums';
import { AuditLogService } from '../src/modules/audit/audit-log.service';
import { AiGovernanceService } from '../src/modules/ai/ai-governance.service';
import { LedgerService } from '../src/modules/ledger/ledger.service';
import { RbacService } from '../src/modules/rbac/rbac.service';
import { LogisticsPolicyService } from '../src/modules/shipments/logistics-policy.service';
import { OperationsService } from '../src/modules/shipments/operations.service';
import { StateMachineService } from '../src/modules/shipments/state-machine.service';
import { WarehouseFlowService } from '../src/modules/warehouse/warehouse-flow.service';
import { TrackingEventService } from '../src/modules/tracking/tracking-event.service';
import { DisputeWorkflowService } from '../src/modules/disputes/dispute-workflow.service';
import { DocumentStorageService } from '../src/modules/documents/document-storage.service';
import { NotificationService } from '../src/modules/notifications/notification.service';
import { LocationService } from '../src/modules/tracking/location.service';
import { AiWorkflowService } from '../src/modules/ai/ai-workflow.service';

const encryption = {
  encrypt: (value: string) => `encrypted:${value}`
};

describe('industrial logistics backend policies', () => {
  let rbac: RbacService;
  let policy: LogisticsPolicyService;
  let stateMachine: StateMachineService;
  let audit: AuditLogService;
  let ledger: LedgerService;
  let operations: OperationsService;
  let ai: AiGovernanceService;
  let warehouse: WarehouseFlowService;
  let tracking: TrackingEventService;
  let disputes: DisputeWorkflowService;
  let documents: DocumentStorageService;
  let notifications: NotificationService;
  let locations: LocationService;
  let aiWorkflows: AiWorkflowService;

  beforeEach(() => {
    rbac = new RbacService();
    policy = new LogisticsPolicyService(rbac);
    stateMachine = new StateMachineService();
    audit = new AuditLogService();
    ledger = new LedgerService();
    operations = new OperationsService(policy, audit, ledger);
    ai = new AiGovernanceService(encryption as never, policy);
    warehouse = new WarehouseFlowService(audit);
    tracking = new TrackingEventService();
    disputes = new DisputeWorkflowService();
    documents = new DocumentStorageService();
    notifications = new NotificationService();
    locations = new LocationService(tracking);
    aiWorkflows = new AiWorkflowService(ai, audit);
  });

  it('keeps logistic disponent first-class but blocks finance/admin powers', () => {
    expect(rbac.hasPermission([RoleCode.LOGISTIC_DISPONENT], 'disponent:assign_driver')).toBe(true);
    expect(rbac.hasPermission([RoleCode.LOGISTIC_DISPONENT], 'finance_rules:manage')).toBe(false);
    expect(rbac.hasPermission([RoleCode.LOGISTIC_DISPONENT], 'audit:delete')).toBe(false);
  });

  it('enforces enum-backed state-machine transitions', () => {
    expect(() => stateMachine.assertOrderTransition(OrderStatus.DRAFT, OrderStatus.QUOTED)).not.toThrow();
    expect(() => stateMachine.assertOrderTransition(OrderStatus.DRAFT, OrderStatus.DELIVERED)).toThrow(BadRequestException);
    expect(() => stateMachine.assertShipmentTransition(ShipmentStatus.AWAITING_DISPATCH, ShipmentStatus.PLANNED)).not.toThrow();
    expect(() => stateMachine.assertShipmentTransition(ShipmentStatus.CREATED, ShipmentStatus.DELIVERED)).toThrow(BadRequestException);
  });

  it('blocks driver assignment until package is ready', () => {
    expect(() => policy.assertCanAssignDriver(PackageStatus.PACKED)).toThrow(BadRequestException);
    expect(() => policy.assertCanAssignDriver(PackageStatus.READY_FOR_DISPATCH)).not.toThrow();
  });

  it('blocks dispatch of unscanned packages', () => {
    expect(() => policy.assertCanDispatchPackage(PackageStatus.READY_FOR_DISPATCH, false)).toThrow(BadRequestException);
    expect(() => policy.assertCanDispatchPackage(PackageStatus.READY_FOR_DISPATCH, true)).not.toThrow();
  });

  it('requires pickup proof', () => {
    expect(() => policy.assertPickupProof({})).toThrow(BadRequestException);
    expect(() => policy.assertPickupProof({ packageScanCode: 'PKG-1' })).not.toThrow();
  });

  it('requires delivery proof and disponent GPS override when outside tolerance', () => {
    expect(() => policy.assertDeliveryProof(ProofTier.MEDIUM_VALUE, {
      gps: { latitude: 51.4, longitude: 6.7, withinTolerance: true },
      otp: '123456'
    })).toThrow(BadRequestException);

    expect(() => policy.assertDeliveryProof(ProofTier.MEDIUM_VALUE, {
      gps: { latitude: 51.4, longitude: 6.7, withinTolerance: false },
      otp: '123456',
      photoObjectKey: 'proof/photo.jpg'
    })).toThrow(ForbiddenException);

    expect(() => policy.assertDeliveryProof(ProofTier.MEDIUM_VALUE, {
      gps: { latitude: 51.4, longitude: 6.7, withinTolerance: false },
      otp: '123456',
      photoObjectKey: 'proof/photo.jpg',
      disponentOverrideApprovalId: 'apr_1'
    })).not.toThrow();
  });

  it('holds escrow until proof is accepted and disputes are closed', () => {
    expect(() => policy.assertEscrowRelease({
      proofAccepted: false,
      disputeStatus: DisputeStatus.NONE,
      settlementWindowPassed: true,
      paymentStatus: PaymentStatus.HELD_IN_ESCROW
    })).toThrow(BadRequestException);

    expect(() => policy.assertEscrowRelease({
      proofAccepted: true,
      disputeStatus: DisputeStatus.OPENED,
      settlementWindowPassed: true,
      paymentStatus: PaymentStatus.HELD_IN_ESCROW
    })).toThrow(BadRequestException);

    expect(() => policy.assertEscrowRelease({
      proofAccepted: true,
      disputeStatus: DisputeStatus.NONE,
      settlementWindowPassed: true,
      paymentStatus: PaymentStatus.HELD_IN_ESCROW
    })).not.toThrow();
  });

  it('creates ledger entry when refund or release happens and blocks ledger mutation', () => {
    const entry = ledger.append({
      accountId: 'escrow_1',
      type: LedgerEntryType.REFUND,
      amount: 50,
      currency: 'EUR',
      referenceType: 'refund',
      referenceId: 'ref_1',
      createdBy: 'finance_1'
    });
    expect(entry.id).toBeDefined();
    expect(() => ledger.update()).toThrow(ConflictException);
    expect(() => ledger.delete()).toThrow(ConflictException);
  });

  it('makes audit logs immutable', () => {
    audit.create({ actorId: 'u1', actorType: 'user', action: 'test.action', targetType: 'shipment', targetId: 's1' });
    expect(audit.list()).toHaveLength(1);
    expect(() => audit.delete()).toThrow(ConflictException);
  });

  it('allows AI L1 but gates high-risk and blocks prohibited actions', () => {
    expect(ai.authorizeAction({
      agentCode: 'ai_tracking_agent',
      requestedAction: 'send ETA update',
      riskLevel: AiRiskLevel.L1_LOW,
      actorRoles: [RoleCode.AI_AGENT]
    })).toEqual({ allowed: true, requiresExecutionLog: true });

    expect(() => ai.authorizeAction({
      agentCode: 'ai_finance_agent',
      requestedAction: 'refund order',
      riskLevel: AiRiskLevel.L3_HIGH,
      actorRoles: [RoleCode.AI_AGENT],
      approvalCount: 0
    })).toThrow(ForbiddenException);

    expect(() => ai.authorizeAction({
      agentCode: 'ai_compliance_agent',
      requestedAction: 'delete audit logs',
      riskLevel: AiRiskLevel.L5_PROHIBITED,
      actorRoles: [RoleCode.AI_AGENT],
      approvalCount: 99
    })).toThrow(ForbiddenException);
  });

  it('records operational audit when completing the accepted flow', () => {
    const assigned = operations.assignDriver('disp_1', PackageStatus.READY_FOR_DISPATCH, 'ship_1', 'drv_1');
    expect(assigned.status).toBe('assigned');
    operations.completePickup('drv_1', 'ship_1', { packageScanCode: 'PKG-1' });
    operations.completeDelivery('drv_1', 'ship_1', ProofTier.LOW_VALUE, {
      gps: { latitude: 51.4, longitude: 6.7, withinTolerance: true },
      otp: '123456'
    });
    expect(audit.list().map((entry) => entry.action)).toEqual(['driver.assigned', 'pickup.completed', 'delivery.completed']);
  });

  it('enforces warehouse pick, scan, pack, label, stage, ready flow', () => {
    expect(() => warehouse.pack('wh_1', 'pkg_1')).toThrow(BadRequestException);
    warehouse.startPick('wh_1', 'pkg_1');
    warehouse.scanItem('wh_1', 'pkg_1', 'BAR-1');
    warehouse.pack('wh_1', 'pkg_1');
    warehouse.generateLabel('wh_1', 'pkg_1');
    warehouse.stage('wh_1', 'pkg_1');
    expect(warehouse.markReady('wm_1', 'pkg_1').status).toBe(PackageStatus.READY_FOR_DISPATCH);
  });

  it('keeps tracking timeline immutable', () => {
    tracking.append({ shipmentId: 'ship_1', eventCode: 'shipment.in_transit', actorType: 'driver', actorId: 'drv_1' });
    expect(tracking.timeline('ship_1')).toHaveLength(1);
    expect(() => tracking.delete()).toThrow(ConflictException);
  });

  it('requires dispute evidence before resolution', () => {
    expect(() => disputes.resolve('disp_1', 'resolved_customer')).toThrow(BadRequestException);
    disputes.addEvidence({ disputeId: 'disp_1', evidenceType: 'proof_of_delivery', objectKey: 'proof/pod.jpg' });
    expect(disputes.resolve('disp_1', 'resolved_customer')).toEqual({ disputeId: 'disp_1', decision: 'resolved_customer', status: 'resolved' });
  });

  it('requires refunds to create immutable ledger entries', () => {
    const entry = operations.refund('finance_1', {
      accountId: 'escrow_1',
      paymentId: 'pay_1',
      amount: 20,
      currency: 'EUR',
      reason: 'return approved'
    });
    expect(entry.type).toBe(LedgerEntryType.REFUND);
    expect(ledger.list()).toHaveLength(1);
    expect(audit.list()[0].action).toBe('refund.created');
  });

  it('stores safe object references for proof and evidence only', () => {
    expect(documents.createReference({
      ownerType: 'shipment',
      ownerId: 'ship_1',
      purpose: 'delivery_photo',
      objectKey: 'proof/ship_1/photo.jpg',
      contentType: 'image/jpeg'
    }).id).toBe('obj_1');
    expect(() => documents.createReference({
      ownerType: 'shipment',
      ownerId: 'ship_1',
      purpose: 'delivery_photo',
      objectKey: '../secret',
      contentType: 'image/jpeg'
    })).toThrow(BadRequestException);
  });

  it('queues email, sms, whatsapp, in-app, and webhook notifications without direct provider coupling', () => {
    notifications.enqueue({ channel: 'email', recipientType: 'customer', recipientId: 'cus_1', templateCode: 'order_created', payload: {} });
    notifications.enqueue({ channel: 'sms', recipientType: 'driver', recipientId: 'drv_1', templateCode: 'job_assigned', payload: {} });
    notifications.enqueue({ channel: 'whatsapp', recipientType: 'customer', recipientId: 'cus_1', templateCode: 'driver_near', payload: {} });
    notifications.enqueue({ channel: 'in_app', recipientType: 'support_agent', recipientId: 'sup_1', templateCode: 'dispute_opened', payload: {} });
    notifications.enqueue({ channel: 'webhook', recipientType: 'merchant', recipientId: 'mer_1', templateCode: 'delivery_completed', payload: {}, webhookUrl: 'https://example.test/webhook' });
    expect(notifications.list()).toHaveLength(5);
  });

  it('records driver GPS check-ins and route deviation events for live map', () => {
    locations.checkIn({ driverId: 'drv_1', shipmentId: 'ship_1', latitude: 51.4, longitude: 6.7, accuracyMeters: 12 });
    locations.routeDeviation({ driverId: 'drv_1', shipmentId: 'ship_1', latitude: 51.5, longitude: 6.8, reason: 'off_route' });
    expect(locations.liveMap().drivers).toHaveLength(1);
    expect(tracking.timeline('ship_1').map((event) => event.eventCode)).toEqual(['driver.location_check_in', 'shipment.route_deviation_detected']);
  });

  it('routes AI operational recommendations through governance and audit', () => {
    const order = aiWorkflows.orderValidation({ actorId: 'ai_1', actorRoles: [RoleCode.AI_AGENT], targetType: 'order', targetId: 'ord_1', payload: {} });
    const warehouseReadiness = aiWorkflows.warehouseReadiness({
      actorId: 'ai_1',
      actorRoles: [RoleCode.AI_AGENT],
      targetType: 'package',
      targetId: 'pkg_1',
      payload: { scanned: true, packed: true, labelGenerated: true, staged: true }
    });
    const tour = aiWorkflows.tourRecommendation({ actorId: 'ai_1', actorRoles: [RoleCode.AI_AGENT], targetType: 'tour_plan', targetId: 'tour_1', payload: { stops: ['A', 'B'] } });
    expect(order.agentCode).toBe('ai_order_agent');
    expect(warehouseReadiness.recommendation.ready).toBe(true);
    expect(tour.recommendation.requiresDisponentApproval).toBe(true);
    expect(audit.list()).toHaveLength(3);
  });

  it('keeps AI finance as recommendation-only behind approval gates', () => {
    expect(() => aiWorkflows.financeRefund({
      actorId: 'ai_1',
      actorRoles: [RoleCode.AI_AGENT],
      targetType: 'payment',
      targetId: 'pay_1',
      payload: {},
      approvalCount: 0
    })).toThrow(ForbiddenException);
    const recommendation = aiWorkflows.financeRefund({
      actorId: 'ai_1',
      actorRoles: [RoleCode.AI_AGENT],
      targetType: 'payment',
      targetId: 'pay_1',
      payload: {},
      approvalCount: 1
    });
    expect(recommendation.recommendation.executionAllowed).toBe(false);
  });
});
