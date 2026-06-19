import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/auth.decorators';
import { GenericCreateDto } from '../../common/dto';
import { RoleCode } from '../../common/domain.enums';

const endpointGroups = [
  'merchants',
  'customers',
  'inventory',
  'routes',
  'fleet',
  'carriers',
  'analytics',
  'admin',
  'compliance'
];

@ApiTags('modular-resource-contracts')
@Controller()
export class GenericResourceController {
  @Get(endpointGroups)
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.LOGISTIC_DISPONENT, RoleCode.WAREHOUSE_MANAGER, RoleCode.FINANCE_ADMIN, RoleCode.COMPLIANCE_ADMIN)
  list() {
    return { items: [], contract: 'module endpoint wired; persistence implementation follows module service boundary' };
  }

  @Post(endpointGroups)
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.LOGISTIC_DISPONENT, RoleCode.WAREHOUSE_MANAGER, RoleCode.FINANCE_ADMIN, RoleCode.COMPLIANCE_ADMIN)
  create(@Body() dto: GenericCreateDto) {
    return { id: 'resource_development', ...dto.data };
  }
}
