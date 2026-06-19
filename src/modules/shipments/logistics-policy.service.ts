import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { AiRiskLevel, DisputeStatus, PackageStatus, PaymentStatus, ProofTier, RoleCode } from '../../common/domain.enums';
import { RbacService } from '../rbac/rbac.service';

export type DeliveryProofInput = {
  gps?: { latitude: number; longitude: number; withinTolerance?: boolean };
  otp?: string;
  photoObjectKey?: string;
  signatureObjectKey?: string;
  idCheckReference?: string;
  packageScanCode?: string;
  disponentOverrideApprovalId?: string;
};

@Injectable()
export class LogisticsPolicyService {
  constructor(private readonly rbac: RbacService) {}

  assertCanAssignDriver(packageStatus: PackageStatus): void {
    if (packageStatus !== PackageStatus.READY_FOR_DISPATCH) {
      throw new BadRequestException('Cannot assign driver if package is not ready for dispatch.');
    }
  }

  assertCanDispatchPackage(packageStatus: PackageStatus, hasScan: boolean): void {
    if (!hasScan || packageStatus !== PackageStatus.READY_FOR_DISPATCH) {
      throw new BadRequestException('Cannot dispatch an unscanned package.');
    }
  }

  assertPickupProof(proof: { packageScanCode?: string; otp?: string; photoObjectKey?: string }): void {
    if (!proof.packageScanCode && !proof.otp && !proof.photoObjectKey) {
      throw new BadRequestException('Cannot mark pickup complete without scan, OTP, or proof.');
    }
  }

  assertDeliveryProof(tier: ProofTier, proof: DeliveryProofInput): void {
    if (!proof.gps) throw new BadRequestException('Delivery proof requires GPS location.');
    if (!proof.gps.withinTolerance && !proof.disponentOverrideApprovalId) {
      throw new ForbiddenException('Driver cannot complete delivery outside GPS tolerance without Disponent approval.');
    }

    if (tier === ProofTier.LOW_VALUE && !(proof.otp || proof.signatureObjectKey)) {
      throw new BadRequestException('Low-value delivery requires GPS plus OTP or signature.');
    }
    if (tier === ProofTier.MEDIUM_VALUE && !(proof.otp && proof.photoObjectKey)) {
      throw new BadRequestException('Medium-value delivery requires GPS, OTP, and photo.');
    }
    if (tier === ProofTier.HIGH_VALUE && !(proof.otp && proof.photoObjectKey && proof.signatureObjectKey && proof.idCheckReference)) {
      throw new BadRequestException('High-value delivery requires GPS, OTP, photo, signature, and ID check reference when legally allowed.');
    }
  }

  assertEscrowRelease(input: {
    proofAccepted: boolean;
    disputeStatus: DisputeStatus;
    settlementWindowPassed: boolean;
    paymentStatus: PaymentStatus;
  }): void {
    if (!input.proofAccepted) throw new BadRequestException('Cannot release escrow before proof is accepted.');
    if (input.disputeStatus !== DisputeStatus.NONE && input.disputeStatus !== DisputeStatus.CLOSED) {
      throw new BadRequestException('Cannot release escrow while an active dispute exists.');
    }
    if (!input.settlementWindowPassed) throw new BadRequestException('Cannot release escrow before settlement window has passed.');
    if (input.paymentStatus !== PaymentStatus.HELD_IN_ESCROW && input.paymentStatus !== PaymentStatus.PARTIALLY_RELEASED) {
      throw new BadRequestException('Payment is not currently releasable from escrow.');
    }
  }

  assertAiActionAllowed(input: {
    riskLevel: AiRiskLevel;
    actorRoles: RoleCode[];
    approvalCount?: number;
    l2AutoPolicyEnabled?: boolean;
  }): void {
    if (input.riskLevel === AiRiskLevel.L5_PROHIBITED) {
      throw new ForbiddenException('Prohibited AI actions are always blocked.');
    }
    if (input.riskLevel === AiRiskLevel.L1_LOW) return;
    if (input.riskLevel === AiRiskLevel.L2_MEDIUM && input.l2AutoPolicyEnabled) return;
    if (input.riskLevel === AiRiskLevel.L2_MEDIUM) {
      this.rbac.assertPermission(input.actorRoles, 'approvals:operational');
      return;
    }
    if (input.riskLevel === AiRiskLevel.L3_HIGH && (input.approvalCount ?? 0) >= 1) return;
    if (input.riskLevel === AiRiskLevel.L4_CRITICAL && (input.approvalCount ?? 0) >= 2) return;
    throw new ForbiddenException('AI action requires the correct human approval gate.');
  }
}
