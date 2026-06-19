import { Injectable, Optional } from '@nestjs/common';
import { AiRiskLevel, RoleCode } from '../../common/domain.enums';
import { AuditLogService } from '../audit/audit-log.service';
import { AiGovernanceService } from './ai-governance.service';
import { PrismaService } from '../../prisma/prisma.service';

type WorkflowInput = {
  actorId: string;
  actorRoles: RoleCode[];
  targetType: string;
  targetId: string;
  payload: Record<string, unknown>;
  approvalCount?: number;
};

@Injectable()
export class AiWorkflowService {
  constructor(
    private readonly governance: AiGovernanceService,
    private readonly audit: AuditLogService,
    @Optional() private readonly prisma?: PrismaService
  ) {}

  orderValidation(input: WorkflowInput) {
    return this.recommend('ai_order_agent', 'validate order intake', AiRiskLevel.L1_LOW, input, {
      valid: true,
      warnings: [],
      requiredNextAction: 'quote_or_payment_authorization'
    });
  }

  warehouseReadiness(input: WorkflowInput) {
    return this.recommend('ai_warehouse_agent', 'warehouse readiness check', AiRiskLevel.L1_LOW, input, {
      ready: Boolean(input.payload.scanned && input.payload.packed && input.payload.labelGenerated && input.payload.staged),
      missing: ['scanned', 'packed', 'labelGenerated', 'staged'].filter((key) => !input.payload[key])
    });
  }

  tourRecommendation(input: WorkflowInput) {
    return this.recommend('ai_disponent_agent', 'recommend tour plan', AiRiskLevel.L1_LOW, input, {
      tourPlan: { stops: input.payload.stops ?? [], optimization: 'eta_and_capacity' },
      requiresDisponentApproval: true
    });
  }

  etaRecommendation(input: WorkflowInput) {
    return this.recommend('ai_route_agent', 'send ETA update', AiRiskLevel.L1_LOW, input, {
      etaMinutes: input.payload.etaMinutes ?? 30,
      confidence: 'medium'
    });
  }

  reassignmentRecommendation(input: WorkflowInput) {
    return this.recommend('ai_route_agent', 'reassign standard delivery', AiRiskLevel.L2_MEDIUM, input, {
      recommendation: 'reassign_to_nearest_available_driver',
      requiresApproval: true
    });
  }

  failedPickup(input: WorkflowInput) {
    return this.recommend('ai_exception_agent', 'handle failed pickup', AiRiskLevel.L2_MEDIUM, input, {
      recommendation: 'reschedule_pickup_or_escalate_to_disponent',
      requiresDisponentApproval: true
    });
  }

  failedDelivery(input: WorkflowInput) {
    return this.recommend('ai_exception_agent', 'handle failed delivery', AiRiskLevel.L2_MEDIUM, input, {
      recommendation: 'schedule_second_attempt_or_return_to_hub',
      requiresDisponentApproval: true
    });
  }

  financeEscrow(input: WorkflowInput) {
    return this.recommend('ai_finance_agent', 'escrow release recommendation only', AiRiskLevel.L3_HIGH, input, {
      recommendation: 'hold_until_proof_and_dispute_clearance',
      executionAllowed: false
    });
  }

  financeRefund(input: WorkflowInput) {
    return this.recommend('ai_finance_agent', 'refund recommendation only', AiRiskLevel.L3_HIGH, input, {
      recommendation: 'refund_requires_finance_approval_and_ledger_entry',
      executionAllowed: false
    });
  }

  disputeEvidenceSummary(input: WorkflowInput) {
    return this.recommend('ai_dispute_agent', 'summarize dispute evidence', AiRiskLevel.L1_LOW, input, {
      summary: 'Evidence summary generated from submitted references.',
      executionAllowed: false
    });
  }

  private recommend(agentCode: string, requestedAction: string, riskLevel: AiRiskLevel, input: WorkflowInput, recommendation: Record<string, unknown>) {
    this.governance.authorizeAction({
      agentCode,
      requestedAction,
      riskLevel,
      actorRoles: input.actorRoles,
      approvalCount: input.approvalCount
    });
    this.audit.create({
      actorId: input.actorId,
      actorType: 'ai_agent',
      action: `ai.${agentCode}.${requestedAction}`,
      targetType: input.targetType,
      targetId: input.targetId,
      riskLevel,
      metadata: { recommendation }
    });
    if (this.hasPrisma()) {
      void this.persistRecommendation(agentCode, requestedAction, riskLevel, input, recommendation);
    }
    return { agentCode, requestedAction, riskLevel, recommendation };
  }

  private async persistRecommendation(agentCode: string, requestedAction: string, riskLevel: AiRiskLevel, input: WorkflowInput, recommendation: Record<string, unknown>) {
    const agent = await (this.prisma as any).aiAgent.upsert({
      where: { code: agentCode },
      update: {},
      create: { code: agentCode, name: agentCode.replace(/_/g, ' ') }
    });
    const task = await (this.prisma as any).aiTask.create({
      data: {
        agentId: agent.id,
        taskType: requestedAction,
        status: 'recommended',
        input: input.payload,
        result: recommendation
      }
    });
    await (this.prisma as any).aiRecommendation.create({
      data: {
        taskId: task.id,
        agentId: agent.id,
        recommendation,
        riskLevel
      }
    });
    if ([AiRiskLevel.L3_HIGH, AiRiskLevel.L4_CRITICAL].includes(riskLevel)) {
      const actionRequest = await (this.prisma as any).aiActionRequest.create({
        data: { taskId: task.id, actionCode: requestedAction, riskLevel, status: 'pending' }
      });
      await (this.prisma as any).aiApprovalGate.create({
        data: { actionRequestId: actionRequest.id, requiredRoles: ['finance_admin', 'compliance_admin'], requiredApprovalCount: riskLevel === AiRiskLevel.L4_CRITICAL ? 2 : 1 }
      });
    }
  }

  private hasPrisma() {
    return Boolean(this.prisma && typeof (this.prisma as any).aiRecommendation?.create === 'function');
  }
}
