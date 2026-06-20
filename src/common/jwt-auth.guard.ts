import { CanActivate, ExecutionContext, Injectable, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY, RequestActor } from './auth.decorators';
import { RoleCode } from './domain.enums';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Optional() private readonly jwt?: JwtService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined>; user?: RequestActor }>();
    const actorId = this.firstHeader(request.headers['x-actor-id']);
    const rolesHeader = request.headers['x-actor-roles'];
    const permissionsHeader = request.headers['x-actor-permissions'];

    if (actorId) {
      request.user = {
        id: actorId,
        roles: this.parseRoles(rolesHeader),
        permissions: this.parseList(permissionsHeader)
      };
      return true;
    }

    const token = this.firstHeader(request.headers.authorization)?.replace(/^Bearer\s+/i, '');
    if (!token || !this.jwt) return false;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; roles?: RoleCode[]; permissions?: string[] }>(token, {
        secret: process.env.JWT_SECRET ?? 'development-local-jwt-secret-change-before-production'
      });
      request.user = { id: payload.sub, roles: payload.roles ?? [], permissions: payload.permissions ?? [] };
      return true;
    } catch {
      return false;
    }
  }

  private parseRoles(value: string | string[] | undefined): RoleCode[] {
    return this.parseList(value)
      .map((role) => this.normalizeRole(role))
      .filter((role): role is RoleCode => Boolean(role));
  }

  private firstHeader(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value;
  }

  private parseList(value: string | string[] | undefined): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.flatMap((item) => this.parseList(item));
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim()).filter(Boolean);
      } catch {
        return [];
      }
    }
    return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
  }

  private normalizeRole(role: string): RoleCode | undefined {
    const normalized = role.trim().toLowerCase().replace(/[\s-]+/g, '_');
    const aliases: Record<string, RoleCode> = {
      admin: RoleCode.SUPER_ADMIN,
      superadmin: RoleCode.SUPER_ADMIN,
      super: RoleCode.SUPER_ADMIN,
      platform_admin: RoleCode.SUPER_ADMIN,
      platformadmin: RoleCode.SUPER_ADMIN,
      logistics_disponent: RoleCode.LOGISTIC_DISPONENT,
      logistics_dispatcher: RoleCode.LOGISTIC_DISPONENT,
      logistics_manager: RoleCode.LOGISTIC_DISPONENT,
      logistic_dispatcher: RoleCode.LOGISTIC_DISPONENT,
      disponent: RoleCode.LOGISTIC_DISPONENT,
      dispatcher: RoleCode.LOGISTIC_DISPONENT,
      warehouse: RoleCode.WAREHOUSE_STAFF,
      warehouse_worker: RoleCode.WAREHOUSE_STAFF,
      warehouse_operator: RoleCode.WAREHOUSE_STAFF,
      warehouse_admin: RoleCode.WAREHOUSE_MANAGER,
      warehouse_supervisor: RoleCode.WAREHOUSE_MANAGER,
      warehouse_lead: RoleCode.WAREHOUSE_MANAGER,
      support: RoleCode.SUPPORT_AGENT,
      support_admin: RoleCode.SUPPORT_AGENT,
      customer_support: RoleCode.SUPPORT_AGENT,
      compliance: RoleCode.COMPLIANCE_ADMIN,
      compliance_officer: RoleCode.COMPLIANCE_ADMIN,
      finance: RoleCode.FINANCE_ADMIN,
      finance_manager: RoleCode.FINANCE_ADMIN,
      finance_officer: RoleCode.FINANCE_ADMIN,
      ai: RoleCode.AI_AGENT
    };
    if (aliases[normalized]) return aliases[normalized];
    return Object.values(RoleCode).includes(normalized as RoleCode) ? normalized as RoleCode : undefined;
  }
}
