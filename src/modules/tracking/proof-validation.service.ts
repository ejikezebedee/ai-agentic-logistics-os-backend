import { Injectable } from '@nestjs/common';
import { ProofTier } from '../../common/domain.enums';
import { DeliveryProofInput, LogisticsPolicyService } from '../shipments/logistics-policy.service';

@Injectable()
export class ProofValidationService {
  constructor(private readonly policy: LogisticsPolicyService) {}

  validateDeliveryProof(tier: ProofTier, proof: DeliveryProofInput): { accepted: true; locked: boolean } {
    this.policy.assertDeliveryProof(tier, proof);
    return { accepted: true, locked: tier === ProofTier.DISPUTED };
  }
}
