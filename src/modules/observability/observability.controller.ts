import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, Roles } from '../../common/auth.decorators';
import { RoleCode } from '../../common/domain.enums';
import { ObservabilityService } from './observability.service';

@ApiTags('observability')
@Controller()
export class ObservabilityController {
  constructor(private readonly observability: ObservabilityService) {}

  @Public()
  @Get('health')
  health() {
    return this.observability.health();
  }

  @Public()
  @Get('readiness')
  readiness() {
    return this.observability.readiness();
  }

  @Get('metrics')
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.COMPLIANCE_ADMIN)
  metrics() {
    return this.observability.metrics();
  }
}
