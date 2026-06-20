import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/auth.decorators';
import { DisputeEvidenceDto } from '../../common/dto';
import { RoleCode } from '../../common/domain.enums';
import { DisputeWorkflowService } from './dispute-workflow.service';

@ApiTags('disputes')
@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputes: DisputeWorkflowService) {}

  @Post('evidence')
  @Roles(RoleCode.CUSTOMER, RoleCode.SUPPORT_AGENT, RoleCode.COMPLIANCE_ADMIN, RoleCode.SUPER_ADMIN)
  addEvidence(@Body() dto: DisputeEvidenceDto) {
    dto.evidenceType = dto.evidenceType ?? 'document';
    dto.metadata = typeof dto.note === 'string' ? { ...(dto.metadata ?? {}), note: dto.note } : dto.metadata;
    return this.disputes.addEvidence(dto);
  }

  @Post(':id/resolve')
  @Roles(RoleCode.SUPPORT_AGENT, RoleCode.FINANCE_ADMIN, RoleCode.SUPER_ADMIN)
  resolve(@Param('id') id: string, @Body() body: { decision: string }) {
    return this.disputes.resolve(id, body.decision);
  }
}
