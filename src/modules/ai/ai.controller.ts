import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/auth.decorators';
import { AiActionDto } from '../../common/dto';
import { RoleCode } from '../../common/domain.enums';
import { AiGovernanceService } from './ai-governance.service';
import { AiWorkflowService } from './ai-workflow.service';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(
    private readonly governance: AiGovernanceService,
    private readonly workflows: AiWorkflowService
  ) {}

  @Get('agents')
  agents() {
    return {
      orchestrator: 'ai_logistics_orchestrator',
      agents: [
        'ai_order_agent',
        'ai_pricing_agent',
        'ai_warehouse_agent',
        'ai_disponent_agent',
        'ai_dispatch_agent',
        'ai_route_agent',
        'ai_tracking_agent',
        'ai_exception_agent',
        'ai_finance_agent',
        'ai_dispute_agent',
        'ai_compliance_agent',
        'ai_support_agent',
        'ai_analytics_agent'
      ]
    };
  }

  @Post('actions/authorize')
  @Roles(RoleCode.AI_AGENT, RoleCode.SUPER_ADMIN)
  authorize(@Body() dto: AiActionDto) {
    const riskLevel = dto.riskLevel ?? this.governance.classifyRisk(dto.requestedAction);
    return { riskLevel, ...this.governance.authorizeAction({ ...dto, riskLevel }) };
  }

  @Post('providers')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.COMPLIANCE_ADMIN)
  createProvider(@Body() body: { apiKey: string; providerName: string }) {
    return { providerName: body.providerName, encryptedApiKey: this.governance.encryptProviderKey(body.apiKey), frontendApiKey: this.governance.maskProviderKey() };
  }

  @Post('order/validate')
  @Roles(RoleCode.AI_AGENT, RoleCode.SUPER_ADMIN)
  validateOrder(@Body() body: Record<string, unknown>) {
    return this.workflows.orderValidation(this.workflowInput('ai_agent', body, 'order', String(body.orderId ?? 'unknown')));
  }

  @Post('warehouse/readiness-check')
  @Roles(RoleCode.AI_AGENT, RoleCode.SUPER_ADMIN)
  readiness(@Body() body: Record<string, unknown>) {
    return this.workflows.warehouseReadiness(this.workflowInput('ai_agent', body, 'package', String(body.packageId ?? 'unknown')));
  }

  @Post('disponent/tour-recommendations')
  @Roles(RoleCode.AI_AGENT, RoleCode.LOGISTIC_DISPONENT, RoleCode.SUPER_ADMIN)
  tourRecommendation(@Body() body: Record<string, unknown>) {
    return this.workflows.tourRecommendation(this.workflowInput('ai_agent', body, 'tour_plan', String(body.tourPlanId ?? 'new')));
  }

  @Post('route/eta')
  @Roles(RoleCode.AI_AGENT, RoleCode.LOGISTIC_DISPONENT, RoleCode.SUPER_ADMIN)
  eta(@Body() body: Record<string, unknown>) {
    return this.workflows.etaRecommendation(this.workflowInput('ai_agent', body, 'shipment', String(body.shipmentId ?? 'unknown')));
  }

  @Post('route/reassignment')
  @Roles(RoleCode.AI_AGENT, RoleCode.LOGISTIC_DISPONENT, RoleCode.SUPER_ADMIN)
  reassignment(@Body() body: Record<string, unknown>) {
    return this.workflows.reassignmentRecommendation(this.workflowInput('ai_agent', body, 'shipment', String(body.shipmentId ?? 'unknown'), [RoleCode.LOGISTIC_DISPONENT]));
  }

  @Post('exceptions/failed-pickup')
  @Roles(RoleCode.AI_AGENT, RoleCode.LOGISTIC_DISPONENT, RoleCode.SUPER_ADMIN)
  failedPickup(@Body() body: Record<string, unknown>) {
    return this.workflows.failedPickup(this.workflowInput('ai_agent', body, 'shipment', String(body.shipmentId ?? 'unknown'), [RoleCode.LOGISTIC_DISPONENT]));
  }

  @Post('exceptions/failed-delivery')
  @Roles(RoleCode.AI_AGENT, RoleCode.LOGISTIC_DISPONENT, RoleCode.SUPER_ADMIN)
  failedDelivery(@Body() body: Record<string, unknown>) {
    return this.workflows.failedDelivery(this.workflowInput('ai_agent', body, 'shipment', String(body.shipmentId ?? 'unknown'), [RoleCode.LOGISTIC_DISPONENT]));
  }

  @Post('finance/escrow-release-recommendation')
  @Roles(RoleCode.AI_AGENT, RoleCode.FINANCE_ADMIN, RoleCode.SUPER_ADMIN)
  escrowRecommendation(@Body() body: Record<string, unknown>) {
    return this.workflows.financeEscrow(this.workflowInput('ai_agent', body, 'escrow', String(body.escrowAccountId ?? 'unknown'), [RoleCode.AI_AGENT], Number(body.approvalCount ?? 0)));
  }

  @Post('finance/refund-recommendation')
  @Roles(RoleCode.AI_AGENT, RoleCode.FINANCE_ADMIN, RoleCode.SUPER_ADMIN)
  refundRecommendation(@Body() body: Record<string, unknown>) {
    return this.workflows.financeRefund(this.workflowInput('ai_agent', body, 'payment', String(body.paymentId ?? 'unknown'), [RoleCode.AI_AGENT], Number(body.approvalCount ?? 0)));
  }

  @Post('disputes/evidence-summary')
  @Roles(RoleCode.AI_AGENT, RoleCode.SUPPORT_AGENT, RoleCode.SUPER_ADMIN)
  evidenceSummary(@Body() body: Record<string, unknown>) {
    return this.workflows.disputeEvidenceSummary(this.workflowInput('ai_agent', body, 'dispute', String(body.disputeId ?? 'unknown')));
  }

  private workflowInput(actorId: string, payload: Record<string, unknown>, targetType: string, targetId: string, actorRoles: RoleCode[] = [RoleCode.AI_AGENT], approvalCount?: number) {
    return { actorId, actorRoles, targetType, targetId, payload, approvalCount };
  }
}
