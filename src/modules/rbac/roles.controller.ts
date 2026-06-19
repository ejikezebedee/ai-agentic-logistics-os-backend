import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RoleCode } from '../../common/domain.enums';
import { ROLE_PERMISSIONS } from './permission-map';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  @Get()
  list() {
    return { roles: Object.values(RoleCode), permissions: ROLE_PERMISSIONS };
  }
}
