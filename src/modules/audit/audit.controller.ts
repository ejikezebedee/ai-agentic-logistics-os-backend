import { Controller, Delete, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/auth.decorators';
import { RoleCode } from '../../common/domain.enums';
import { AuditLogService } from './audit-log.service';

@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditLogService) {}

  @Get()
  @Roles(RoleCode.COMPLIANCE_ADMIN, RoleCode.SUPER_ADMIN)
  list() {
    return this.audit.list();
  }

  @Delete(':id')
  @Roles(RoleCode.SUPER_ADMIN)
  delete() {
    return this.audit.delete();
  }
}
