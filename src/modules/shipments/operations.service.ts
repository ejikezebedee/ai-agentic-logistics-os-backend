import { Injectable, Optional } from '@nestjs/common';
import { CustodyType, DisputeStatus, LedgerEntryType, PackageStatus, PaymentStatus, ProofTier, RoleCode, ShipmentStatus } from '../../common/domain.enums';
import { AuditLogService } from '../audit/audit-log.service';
import { LedgerService } from '../ledger/ledger.service';
import { DeliveryProofInput, LogisticsPolicyService } from './logistics-policy.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OperationsService {
  constructor(
    private readonly policy: LogisticsPolicyService,
    private readonly audit: AuditLogService,
    private readonly ledger: LedgerService,
    @Optional() private readonly prisma?: PrismaService
  ) {}

  assignDriver(actorId: string, packageStatus: PackageStatus, shipmentId: string, driverId: string) {
    this.policy.assertCanAssignDriver(packageStatus);
    if (this.hasPrisma()) {
      void (this.prisma as any).$transaction([
        (this.prisma as any).dispatchAssignment.create({ data: { shipmentId, driverId, assignedBy: actorId, status: 'assigned' } }),
        (this.prisma as any).shipment.update({ where: { id: shipmentId }, data: { status: ShipmentStatus.ASSIGNED, custodyType: CustodyType.DRIVER, custodyActorId: driverId, responsibility: 'driver' } })
      ]).catch(() => undefined);
    }
    this.audit.create({ actorId, actorType: 'user', action: 'driver.assigned', targetType: 'shipment', targetId: shipmentId, metadata: { driverId } });
    return { shipmentId, driverId, status: 'assigned' };
  }

  completePickup(actorId: string, shipmentId: string, proof: { packageScanCode?: string; otp?: string; photoObjectKey?: string }) {
    this.policy.assertPickupProof(proof);
    if (this.hasPrisma()) {
      void (this.prisma as any).$transaction([
        (this.prisma as any).pickupAttempt.create({ data: { shipmentId, driverId: actorId, status: 'completed', proof } }),
        (this.prisma as any).shipment.update({ where: { id: shipmentId }, data: { status: ShipmentStatus.PICKED_UP, custodyType: CustodyType.DRIVER, custodyActorId: actorId } }),
        (this.prisma as any).trackingEvent.create({ data: { shipmentId, eventCode: 'pickup.completed', actorType: 'driver', actorId, proofRef: proof.photoObjectKey, metadata: proof } })
      ]).catch(() => undefined);
    }
    this.audit.create({ actorId, actorType: 'driver', action: 'pickup.completed', targetType: 'shipment', targetId: shipmentId, metadata: proof });
    return { shipmentId, status: 'picked_up' };
  }

  completeDelivery(actorId: string, shipmentId: string, tier: ProofTier, proof: DeliveryProofInput) {
    this.policy.assertDeliveryProof(tier, proof);
    if (this.hasPrisma()) {
      void (this.prisma as any).$transaction([
        (this.prisma as any).deliveryAttempt.create({ data: { shipmentId, driverId: actorId, status: 'completed', proof } }),
        (this.prisma as any).proofOfDelivery.upsert({
          where: { shipmentId },
          update: { gps: proof.gps, photoObjectKey: proof.photoObjectKey, signatureObjectKey: proof.signatureObjectKey, packageScanCode: proof.packageScanCode, acceptedAt: new Date(), lockedAt: new Date() },
          create: { shipmentId, driverId: actorId, gps: proof.gps, photoObjectKey: proof.photoObjectKey, signatureObjectKey: proof.signatureObjectKey, packageScanCode: proof.packageScanCode, acceptedAt: new Date(), lockedAt: new Date() }
        }),
        (this.prisma as any).shipment.update({ where: { id: shipmentId }, data: { status: ShipmentStatus.DELIVERED, custodyType: CustodyType.CUSTOMER, responsibility: 'customer' } }),
        (this.prisma as any).trackingEvent.create({ data: { shipmentId, eventCode: 'delivery.completed', actorType: 'driver', actorId, proofRef: proof.photoObjectKey, metadata: proof } })
      ]).catch(() => undefined);
    }
    this.audit.create({ actorId, actorType: 'driver', action: 'delivery.completed', targetType: 'shipment', targetId: shipmentId, metadata: { tier, objectKeys: { photo: proof.photoObjectKey, signature: proof.signatureObjectKey } } });
    return { shipmentId, status: 'delivered', proofAccepted: true };
  }

  releaseEscrow(actorId: string, input: {
    accountId: string;
    shipmentId: string;
    amount: number;
    currency: string;
    proofAccepted: boolean;
    disputeStatus: DisputeStatus;
    settlementWindowPassed: boolean;
    paymentStatus: PaymentStatus;
    actorRoles: RoleCode[];
  }) {
    this.policy.assertEscrowRelease(input);
    const entry = this.ledger.append({
      accountId: input.accountId,
      amount: input.amount,
      currency: input.currency,
      type: LedgerEntryType.ESCROW_RELEASE,
      referenceType: 'shipment',
      referenceId: input.shipmentId,
      createdBy: actorId
    });
    this.audit.create({ actorId, actorType: 'finance_admin', action: 'escrow.released', targetType: 'shipment', targetId: input.shipmentId, metadata: { ledgerEntryId: entry.id } });
    return entry;
  }

  refund(actorId: string, input: {
    accountId: string;
    paymentId: string;
    amount: number;
    currency: string;
    reason: string;
  }) {
    const entry = this.ledger.append({
      accountId: input.accountId,
      amount: input.amount,
      currency: input.currency,
      type: LedgerEntryType.REFUND,
      referenceType: 'payment',
      referenceId: input.paymentId,
      createdBy: actorId,
      metadata: { reason: input.reason }
    });
    this.audit.create({ actorId, actorType: 'finance_admin', action: 'refund.created', targetType: 'payment', targetId: input.paymentId, metadata: { ledgerEntryId: entry.id } });
    return entry;
  }

  private hasPrisma() {
    return Boolean(this.prisma && typeof (this.prisma as any).shipment?.update === 'function');
  }
}
