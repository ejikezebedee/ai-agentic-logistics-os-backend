import { ForbiddenException, Injectable } from '@nestjs/common';
import { AiRiskLevel, RoleCode } from '../../common/domain.enums';
import { EncryptionService } from '../../common/encryption.service';
import { LogisticsPolicyService } from '../shipments/logistics-policy.service';

export type AiActionRequest = {
  agentCode: string;
  requestedAction: string;
  riskLevel: AiRiskLevel;
  actorRoles: RoleCode[];
  approvalCount?: number;
  l2AutoPolicyEnabled?: boolean;
};

@Injectable()
export class AiGovernanceService {
  constructor(
    private readonly encryption: EncryptionService,
    private readonly policy: LogisticsPolicyService
  ) {}

  encryptProviderKey(apiKey: string): string {
    return this.encryption.encrypt(apiKey);
  }

  maskProviderKey(): string {
    return '***redacted***';
  }

  classifyRisk(action: string): AiRiskLevel {
    const normalized = action.toLowerCase();
    if (normalized.includes('delete audit') || normalized.includes('delete evidence') || normalized.includes('alter ledger')) {
      return AiRiskLevel.L5_PROHIBITED;
    }
    if (normalized.includes('disputed escrow') || normalized.includes('account suspension')) return AiRiskLevel.L4_CRITICAL;
    if (normalized.includes('refund') || normalized.includes('penalty') || normalized.includes('high-value reroute')) return AiRiskLevel.L3_HIGH;
    if (normalized.includes('reassign') || normalized.includes('reschedule')) return AiRiskLevel.L2_MEDIUM;
    return AiRiskLevel.L1_LOW;
  }

  authorizeAction(request: AiActionRequest): { allowed: true; requiresExecutionLog: true } {
    if (request.actorRoles.includes(RoleCode.AI_AGENT) && request.requestedAction.includes('bypass')) {
      throw new ForbiddenException('AI agents cannot bypass role permissions or approval gates.');
    }
    this.policy.assertAiActionAllowed(request);
    return { allowed: true, requiresExecutionLog: true };
  }
}
