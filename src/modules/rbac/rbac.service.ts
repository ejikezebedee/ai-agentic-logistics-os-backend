import { ForbiddenException, Injectable } from '@nestjs/common';
import { RoleCode } from '../../common/domain.enums';
import { DISPONENT_FORBIDDEN_PERMISSIONS, ROLE_PERMISSIONS } from './permission-map';

@Injectable()
export class RbacService {
  hasRole(actorRoles: RoleCode[], role: RoleCode): boolean {
    return actorRoles.includes(RoleCode.SUPER_ADMIN) || actorRoles.includes(role);
  }

  hasPermission(actorRoles: RoleCode[], permission: string): boolean {
    if (actorRoles.includes(RoleCode.LOGISTIC_DISPONENT) && DISPONENT_FORBIDDEN_PERMISSIONS.includes(permission)) {
      return false;
    }
    return actorRoles.some((role) => ROLE_PERMISSIONS[role]?.includes('*') || ROLE_PERMISSIONS[role]?.includes(permission));
  }

  assertPermission(actorRoles: RoleCode[], permission: string): void {
    if (!this.hasPermission(actorRoles, permission)) {
      throw new ForbiddenException(`Missing permission: ${permission}`);
    }
  }
}
