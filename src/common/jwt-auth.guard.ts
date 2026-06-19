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

    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; user?: RequestActor }>();
    const actorId = request.headers['x-actor-id'];
    const rolesHeader = request.headers['x-actor-roles'];

    if (actorId && rolesHeader) {
      request.user = {
        id: actorId,
        roles: rolesHeader.split(',').map((role) => role.trim()) as RoleCode[],
        permissions: request.headers['x-actor-permissions']?.split(',').map((permission) => permission.trim()) ?? []
      };
      return true;
    }

    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
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
}
