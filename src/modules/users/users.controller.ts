import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/auth.decorators';
import { RoleCode } from '../../common/domain.enums';

@ApiTags('users')
@Controller('users')
export class UsersController {
  @Get()
  @Roles(RoleCode.SUPER_ADMIN, RoleCode.COMPLIANCE_ADMIN)
  list() {
    return { resource: 'users', privacy: 'role-filtered user list endpoint' };
  }
}
