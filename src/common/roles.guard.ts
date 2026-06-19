import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './auth.decorators';
import { RoleCode } from './domain.enums';
import { ROLE_PERMISSIONS } from '../modules/rbac/permission-map';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleCode[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: { roles?: RoleCode[]; permissions?: string[] } }>();
    const actorRoles = request.user?.roles ?? [];
    const actorPermissions = request.user?.permissions ?? [];
    return requiredRoles.some((role) => actorRoles.includes(role) || this.permissionsSatisfyRole(actorPermissions, role));
  }

  private permissionsSatisfyRole(actorPermissions: string[], role: RoleCode) {
    if (actorPermissions.includes('*')) return true;
    const requiredPermissions = ROLE_PERMISSIONS[role] ?? [];
    return requiredPermissions.some((permission) => {
      if (actorPermissions.includes(permission)) return true;
      const prefix = permission.endsWith('*') ? permission.slice(0, -1) : undefined;
      return prefix ? actorPermissions.some((actorPermission) => actorPermission.startsWith(prefix)) : false;
    });
  }
}
