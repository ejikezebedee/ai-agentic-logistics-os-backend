import { BadRequestException, Injectable } from '@nestjs/common';
import { DisputeStatus, OrderStatus, PaymentStatus, ReturnStatus, ShipmentStatus } from '../../common/domain.enums';

const orderTransitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.DRAFT]: [OrderStatus.QUOTED, OrderStatus.CANCELLED],
  [OrderStatus.QUOTED]: [OrderStatus.BOOKED, OrderStatus.CANCELLED],
  [OrderStatus.BOOKED]: [OrderStatus.PAYMENT_PENDING, OrderStatus.CANCELLED],
  [OrderStatus.PAYMENT_PENDING]: [OrderStatus.PAYMENT_AUTHORIZED, OrderStatus.CANCELLED],
  [OrderStatus.PAYMENT_AUTHORIZED]: [OrderStatus.INVENTORY_RESERVED],
  [OrderStatus.INVENTORY_RESERVED]: [OrderStatus.WAREHOUSE_PROCESSING],
  [OrderStatus.WAREHOUSE_PROCESSING]: [OrderStatus.READY_FOR_DISPATCH],
  [OrderStatus.READY_FOR_DISPATCH]: [OrderStatus.TRANSPORT_PLANNED],
  [OrderStatus.TRANSPORT_PLANNED]: [OrderStatus.DRIVER_ASSIGNED],
  [OrderStatus.DRIVER_ASSIGNED]: [OrderStatus.PICKED_UP],
  [OrderStatus.PICKED_UP]: [OrderStatus.IN_TRANSIT],
  [OrderStatus.IN_TRANSIT]: [OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERY_ATTEMPTED, OrderStatus.DELIVERED],
  [OrderStatus.DELIVERY_ATTEMPTED]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [OrderStatus.PROOF_ACCEPTED],
  [OrderStatus.PROOF_ACCEPTED]: [OrderStatus.SETTLEMENT_PENDING],
  [OrderStatus.SETTLEMENT_PENDING]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: []
};

const shipmentTransitions: Record<ShipmentStatus, ShipmentStatus[]> = {
  [ShipmentStatus.CREATED]: [ShipmentStatus.AWAITING_DISPATCH],
  [ShipmentStatus.AWAITING_DISPATCH]: [ShipmentStatus.PLANNED],
  [ShipmentStatus.PLANNED]: [ShipmentStatus.ASSIGNED],
  [ShipmentStatus.ASSIGNED]: [ShipmentStatus.PICKUP_SCHEDULED],
  [ShipmentStatus.PICKUP_SCHEDULED]: [ShipmentStatus.PICKED_UP, ShipmentStatus.FAILED],
  [ShipmentStatus.PICKED_UP]: [ShipmentStatus.IN_TRANSIT],
  [ShipmentStatus.IN_TRANSIT]: [ShipmentStatus.AT_HUB, ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.FAILED, ShipmentStatus.LOST, ShipmentStatus.DAMAGED],
  [ShipmentStatus.AT_HUB]: [ShipmentStatus.SORTED],
  [ShipmentStatus.SORTED]: [ShipmentStatus.OUT_FOR_DELIVERY],
  [ShipmentStatus.OUT_FOR_DELIVERY]: [ShipmentStatus.DELIVERED, ShipmentStatus.FAILED, ShipmentStatus.RETURNED],
  [ShipmentStatus.DELIVERED]: [],
  [ShipmentStatus.FAILED]: [ShipmentStatus.RETURNED, ShipmentStatus.PLANNED],
  [ShipmentStatus.RETURNED]: [],
  [ShipmentStatus.LOST]: [],
  [ShipmentStatus.DAMAGED]: [ShipmentStatus.RETURNED]
};

const paymentTransitions: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.NOT_REQUIRED]: [],
  [PaymentStatus.PENDING]: [PaymentStatus.AUTHORIZED, PaymentStatus.FAILED],
  [PaymentStatus.AUTHORIZED]: [PaymentStatus.CAPTURED, PaymentStatus.FAILED],
  [PaymentStatus.CAPTURED]: [PaymentStatus.HELD_IN_ESCROW, PaymentStatus.REFUNDED, PaymentStatus.CHARGEBACK],
  [PaymentStatus.HELD_IN_ESCROW]: [PaymentStatus.PARTIALLY_RELEASED, PaymentStatus.RELEASED, PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.CHARGEBACK],
  [PaymentStatus.PARTIALLY_RELEASED]: [PaymentStatus.RELEASED, PaymentStatus.PARTIALLY_REFUNDED],
  [PaymentStatus.RELEASED]: [PaymentStatus.CHARGEBACK],
  [PaymentStatus.REFUNDED]: [],
  [PaymentStatus.PARTIALLY_REFUNDED]: [PaymentStatus.REFUNDED],
  [PaymentStatus.CHARGEBACK]: [],
  [PaymentStatus.FAILED]: []
};

const disputeTransitions: Record<DisputeStatus, DisputeStatus[]> = {
  [DisputeStatus.NONE]: [DisputeStatus.OPENED],
  [DisputeStatus.OPENED]: [DisputeStatus.EVIDENCE_COLLECTING],
  [DisputeStatus.EVIDENCE_COLLECTING]: [DisputeStatus.UNDER_REVIEW],
  [DisputeStatus.UNDER_REVIEW]: [DisputeStatus.DECISION_PENDING],
  [DisputeStatus.DECISION_PENDING]: [
    DisputeStatus.RESOLVED_CUSTOMER,
    DisputeStatus.RESOLVED_MERCHANT,
    DisputeStatus.RESOLVED_DRIVER,
    DisputeStatus.RESOLVED_PLATFORM
  ],
  [DisputeStatus.RESOLVED_CUSTOMER]: [DisputeStatus.CLOSED],
  [DisputeStatus.RESOLVED_MERCHANT]: [DisputeStatus.CLOSED],
  [DisputeStatus.RESOLVED_DRIVER]: [DisputeStatus.CLOSED],
  [DisputeStatus.RESOLVED_PLATFORM]: [DisputeStatus.CLOSED],
  [DisputeStatus.CLOSED]: []
};

const returnTransitions: Record<ReturnStatus, ReturnStatus[]> = {
  [ReturnStatus.RETURN_REQUESTED]: [ReturnStatus.RETURN_APPROVED, ReturnStatus.RETURN_REJECTED],
  [ReturnStatus.RETURN_APPROVED]: [ReturnStatus.RETURN_PICKUP_PLANNED],
  [ReturnStatus.RETURN_REJECTED]: [ReturnStatus.CLOSED],
  [ReturnStatus.RETURN_PICKUP_PLANNED]: [ReturnStatus.RETURN_PICKED_UP],
  [ReturnStatus.RETURN_PICKED_UP]: [ReturnStatus.RETURN_RECEIVED],
  [ReturnStatus.RETURN_RECEIVED]: [ReturnStatus.INSPECTION_PENDING],
  [ReturnStatus.INSPECTION_PENDING]: [ReturnStatus.REFUND_PENDING, ReturnStatus.RESTOCKED, ReturnStatus.DISCARDED],
  [ReturnStatus.REFUND_PENDING]: [ReturnStatus.REFUND_COMPLETED],
  [ReturnStatus.REFUND_COMPLETED]: [ReturnStatus.CLOSED],
  [ReturnStatus.RESTOCKED]: [ReturnStatus.CLOSED],
  [ReturnStatus.DISCARDED]: [ReturnStatus.CLOSED],
  [ReturnStatus.CLOSED]: []
};

@Injectable()
export class StateMachineService {
  assertOrderTransition(from: OrderStatus, to: OrderStatus): void {
    this.assertTransition('order', from, to, orderTransitions[from]);
  }

  assertShipmentTransition(from: ShipmentStatus, to: ShipmentStatus): void {
    this.assertTransition('shipment', from, to, shipmentTransitions[from]);
  }

  assertPaymentTransition(from: PaymentStatus, to: PaymentStatus): void {
    this.assertTransition('payment', from, to, paymentTransitions[from]);
  }

  assertDisputeTransition(from: DisputeStatus, to: DisputeStatus): void {
    this.assertTransition('dispute', from, to, disputeTransitions[from]);
  }

  assertReturnTransition(from: ReturnStatus, to: ReturnStatus): void {
    this.assertTransition('return', from, to, returnTransitions[from]);
  }

  nextShipmentStates(status: ShipmentStatus): ShipmentStatus[] {
    return shipmentTransitions[status];
  }

  private assertTransition(entity: string, from: string, to: string, allowed: string[]): void {
    if (!allowed.includes(to)) {
      throw new BadRequestException(`Invalid ${entity} transition from ${from} to ${to}.`);
    }
  }
}
