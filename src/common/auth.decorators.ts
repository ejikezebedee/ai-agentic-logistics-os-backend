import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RoleCode } from './domain.enums';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleCode[]) => SetMetadata(ROLES_KEY, roles);

export type RequestActor = {
  id: string;
  roles: RoleCode[];
  permissions?: string[];
  isAiAgent?: boolean;
};

export const Actor = createParamDecorator((_data: unknown, ctx: ExecutionContext): RequestActor | undefined => {
  const request = ctx.switchToHttp().getRequest<{ user?: RequestActor }>();
  return request.user;
});
