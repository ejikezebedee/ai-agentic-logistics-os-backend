import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY, RateLimitPolicy } from './rate-limit.decorator';

type Bucket = {
  count: number;
  resetAt: number;
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      ip?: string;
      method?: string;
      route?: { path?: string };
      path?: string;
      originalUrl?: string;
      headers: Record<string, string | string[] | undefined>;
      user?: { id?: string };
    }>();
    const policy = this.policyFor(context, request.path ?? request.originalUrl ?? '');
    if (!policy) return true;

    const now = Date.now();
    const identity = this.identityFor(request);
    const route = request.route?.path ?? request.path ?? request.originalUrl ?? 'unknown';
    const key = `${policy.keyPrefix ?? route}:${identity}`;
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + policy.windowMs });
      return true;
    }

    if (bucket.count >= policy.limit) {
      throw new HttpException({
        message: 'Rate limit exceeded.',
        retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000)
      }, HttpStatus.TOO_MANY_REQUESTS);
    }

    bucket.count += 1;
    return true;
  }

  private policyFor(context: ExecutionContext, path: string): RateLimitPolicy | undefined {
    const explicit = this.reflector.getAllAndOverride<RateLimitPolicy>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (explicit) return explicit;

    if (path.includes('/auth/login')) return { limit: 5, windowMs: 60_000, keyPrefix: 'auth-login' };
    if (path.includes('/auth/password-reset')) return { limit: 3, windowMs: 15 * 60_000, keyPrefix: 'password-reset' };
    if (path.includes('/ai/')) return { limit: 30, windowMs: 60_000, keyPrefix: 'ai' };
    if (path.includes('/tracking/')) return { limit: 120, windowMs: 60_000, keyPrefix: 'tracking' };
    if (path.includes('/documents/upload-reference')) return { limit: 30, windowMs: 60_000, keyPrefix: 'documents' };
    if (path.includes('/provider-adapters/')) return { limit: 20, windowMs: 60_000, keyPrefix: 'providers' };
    if (path.includes('/driver/location')) return { limit: 60, windowMs: 60_000, keyPrefix: 'driver-location' };
    return undefined;
  }

  private identityFor(request: { headers: Record<string, string | string[] | undefined>; ip?: string; user?: { id?: string } }) {
    const actorId = request.user?.id ?? request.headers['x-actor-id'];
    if (typeof actorId === 'string' && actorId.trim()) return `actor:${actorId}`;
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) return `ip:${forwarded.split(',')[0].trim()}`;
    return `ip:${request.ip ?? 'unknown'}`;
  }
}
