export enum RoleCode {
  CUSTOMER = 'customer',
  MERCHANT = 'merchant',
  SHIPPER = 'shipper',
  WAREHOUSE_STAFF = 'warehouse_staff',
  WAREHOUSE_MANAGER = 'warehouse_manager',
  DRIVER = 'driver',
  FLEET_MANAGER = 'fleet_manager',
  CARRIER = 'carrier',
  FREIGHT_FORWARDER = 'freight_forwarder',
  LOGISTIC_DISPONENT = 'logistic_disponent',
  SUPPORT_AGENT = 'support_agent',
  FINANCE_ADMIN = 'finance_admin',
  COMPLIANCE_ADMIN = 'compliance_admin',
  SUPER_ADMIN = 'super_admin',
  AI_AGENT = 'ai_agent'
}

export enum OrderStatus {
  DRAFT = 'draft',
  QUOTED = 'quoted',
  BOOKED = 'booked',
  PAYMENT_PENDING = 'payment_pending',
  PAYMENT_AUTHORIZED = 'payment_authorized',
  INVENTORY_RESERVED = 'inventory_reserved',
  WAREHOUSE_PROCESSING = 'warehouse_processing',
  READY_FOR_DISPATCH = 'ready_for_dispatch',
  TRANSPORT_PLANNED = 'transport_planned',
  DRIVER_ASSIGNED = 'driver_assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERY_ATTEMPTED = 'delivery_attempted',
  DELIVERED = 'delivered',
  PROOF_ACCEPTED = 'proof_accepted',
  SETTLEMENT_PENDING = 'settlement_pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ShipmentStatus {
  CREATED = 'created',
  AWAITING_DISPATCH = 'awaiting_dispatch',
  PLANNED = 'planned',
  ASSIGNED = 'assigned',
  PICKUP_SCHEDULED = 'pickup_scheduled',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  AT_HUB = 'at_hub',
  SORTED = 'sorted',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETURNED = 'returned',
  LOST = 'lost',
  DAMAGED = 'damaged'
}

export enum PaymentStatus {
  NOT_REQUIRED = 'not_required',
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  HELD_IN_ESCROW = 'held_in_escrow',
  PARTIALLY_RELEASED = 'partially_released',
  RELEASED = 'released',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CHARGEBACK = 'chargeback',
  FAILED = 'failed'
}

export enum DisputeStatus {
  NONE = 'none',
  OPENED = 'opened',
  EVIDENCE_COLLECTING = 'evidence_collecting',
  UNDER_REVIEW = 'under_review',
  DECISION_PENDING = 'decision_pending',
  RESOLVED_CUSTOMER = 'resolved_customer',
  RESOLVED_MERCHANT = 'resolved_merchant',
  RESOLVED_DRIVER = 'resolved_driver',
  RESOLVED_PLATFORM = 'resolved_platform',
  CLOSED = 'closed'
}

export enum ReturnStatus {
  RETURN_REQUESTED = 'return_requested',
  RETURN_APPROVED = 'return_approved',
  RETURN_REJECTED = 'return_rejected',
  RETURN_PICKUP_PLANNED = 'return_pickup_planned',
  RETURN_PICKED_UP = 'return_picked_up',
  RETURN_RECEIVED = 'return_received',
  INSPECTION_PENDING = 'inspection_pending',
  REFUND_PENDING = 'refund_pending',
  REFUND_COMPLETED = 'refund_completed',
  RESTOCKED = 'restocked',
  DISCARDED = 'discarded',
  CLOSED = 'closed'
}

export enum PackageStatus {
  CREATED = 'created',
  RESERVED = 'reserved',
  PICKING = 'picking',
  SCANNED = 'scanned',
  PACKED = 'packed',
  LABEL_GENERATED = 'label_generated',
  STAGED = 'staged',
  READY_FOR_DISPATCH = 'ready_for_dispatch',
  DISPATCHED = 'dispatched',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
  QUARANTINED = 'quarantined',
  DAMAGED = 'damaged',
  LOST = 'lost'
}

export enum ProofTier {
  LOW_VALUE = 'low_value',
  MEDIUM_VALUE = 'medium_value',
  HIGH_VALUE = 'high_value',
  DISPUTED = 'disputed'
}

export enum AiRiskLevel {
  L1_LOW = 'L1_LOW',
  L2_MEDIUM = 'L2_MEDIUM',
  L3_HIGH = 'L3_HIGH',
  L4_CRITICAL = 'L4_CRITICAL',
  L5_PROHIBITED = 'L5_PROHIBITED'
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export enum LedgerEntryType {
  DEBIT = 'debit',
  CREDIT = 'credit',
  REVERSAL = 'reversal',
  CORRECTION = 'correction',
  ESCROW_HOLD = 'escrow_hold',
  ESCROW_RELEASE = 'escrow_release',
  REFUND = 'refund',
  PAYOUT = 'payout',
  COMMISSION = 'commission'
}

export enum TrackingEventCode {
  ORDER_CREATED = 'order.created',
  ORDER_QUOTED = 'order.quoted',
  PAYMENT_AUTHORIZED = 'payment.authorized',
  PAYMENT_ESCROW_CREATED = 'payment.escrow_created',
  INVENTORY_RESERVED = 'inventory.reserved',
  WAREHOUSE_PICK_STARTED = 'warehouse.pick_started',
  WAREHOUSE_ITEM_SCANNED = 'warehouse.item_scanned',
  WAREHOUSE_PACKED = 'warehouse.packed',
  SHIPMENT_READY_FOR_DISPATCH = 'shipment.ready_for_dispatch',
  AI_DISPONENT_PLAN_RECOMMENDED = 'ai.disponent.plan_recommended',
  DISPONENT_PLAN_APPROVED = 'disponent.plan_approved',
  DRIVER_ASSIGNED = 'driver.assigned',
  DRIVER_ACCEPTED = 'driver.accepted',
  PICKUP_COMPLETED = 'pickup.completed',
  SHIPMENT_IN_TRANSIT = 'shipment.in_transit',
  SHIPMENT_DELAYED = 'shipment.delayed',
  SHIPMENT_ROUTE_DEVIATION_DETECTED = 'shipment.route_deviation_detected',
  HUB_ARRIVED = 'hub.arrived',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERY_ATTEMPTED = 'delivery.attempted',
  DELIVERY_COMPLETED = 'delivery.completed',
  PROOF_ACCEPTED = 'proof.accepted',
  ESCROW_RELEASE_REQUESTED = 'escrow.release_requested',
  ESCROW_RELEASED = 'escrow.released',
  RETURN_REQUESTED = 'return.requested',
  DISPUTE_OPENED = 'dispute.opened',
  DISPUTE_RESOLVED = 'dispute.resolved',
  ORDER_COMPLETED = 'order.completed'
}

export enum CustodyType {
  CUSTOMER = 'customer',
  MERCHANT = 'merchant',
  WAREHOUSE = 'warehouse',
  DRIVER = 'driver',
  CARRIER = 'carrier',
  PLATFORM = 'platform',
  UNKNOWN = 'unknown'
}
