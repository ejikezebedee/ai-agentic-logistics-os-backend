import { Body, Controller, Get, Optional, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor, RequestActor, Roles } from '../../common/auth.decorators';
import { AiRiskLevel, ApprovalStatus, RoleCode } from '../../common/domain.enums';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('approvals')
@Controller('approvals')
export class ApprovalsController {
  private readonly memoryRequests: Array<Record<string, unknown>> = [];

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  @Post()
  @Roles(RoleCode.AI_AGENT, RoleCode.LOGISTIC_DISPONENT, RoleCode.FINANCE_ADMIN, RoleCode.COMPLIANCE_ADMIN, RoleCode.SUPER_ADMIN)
  async request(@Actor() actor: RequestActor, @Body() body: { actionCode: string; riskLevel?: AiRiskLevel; context: Record<string, unknown> }) {
    if (this.hasPrisma()) {
      return (this.prisma as any).approvalRequest.create({
        data: { requesterType: actor.roles.includes(RoleCode.AI_AGENT) ? 'ai_agent' : 'user', requesterId: actor.id, actionCode: body.actionCode, riskLevel: body.riskLevel, context: body.context }
      });
    }
    const request = { id: `apr_${this.memoryRequests.length + 1}`, requesterId: actor.id, status: ApprovalStatus.PENDING, ...body };
    this.memoryRequests.push(request);
    return request;
  }

  @Get()
  @Roles(RoleCode.COMPLIANCE_ADMIN, RoleCode.FINANCE_ADMIN, RoleCode.SUPER_ADMIN)
  async list() {
    if (this.hasPrisma()) return (this.prisma as any).approvalRequest.findMany({ orderBy: { createdAt: 'desc' }, include: { decisions: true } });
    return { items: this.memoryRequests };
  }

  @Post(':id/decision')
  @Roles(RoleCode.COMPLIANCE_ADMIN, RoleCode.FINANCE_ADMIN, RoleCode.SUPER_ADMIN)
  async decide(@Actor() actor: RequestActor, @Param('id') id: string, @Body() body: { decision: ApprovalStatus; comment?: string }) {
    if (![ApprovalStatus.APPROVED, ApprovalStatus.REJECTED].includes(body.decision)) {
      return { id, status: 'ignored', reason: 'Only approved/rejected decisions are accepted here.' };
    }
    if (this.hasPrisma()) {
      return (this.prisma as any).$transaction([
        (this.prisma as any).approvalDecision.create({ data: { requestId: id, approverId: actor.id, decision: body.decision, comment: body.comment } }),
        (this.prisma as any).approvalRequest.update({ where: { id }, data: { status: body.decision } })
      ]);
    }
    return { id, approverId: actor.id, decision: body.decision };
  }

  @Post('refunds/:id/approve')
  @Roles(RoleCode.FINANCE_ADMIN, RoleCode.COMPLIANCE_ADMIN, RoleCode.SUPER_ADMIN)
  async approveRefund(@Actor() actor: RequestActor, @Param('id') id: string, @Body() body: { comment?: string }) {
    return this.decide(actor, id, { decision: ApprovalStatus.APPROVED, comment: body?.comment ?? 'Refund approved through industrial MVP approval endpoint.' });
  }

  private hasPrisma() {
    return Boolean(this.prisma && typeof (this.prisma as any).approvalRequest?.create === 'function');
  }
}
