import { ExecutionContext, HttpException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { createHmac } from 'crypto';
import { AuthService } from '../src/modules/auth/auth.service';
import { ObservabilityService } from '../src/modules/observability/observability.service';
import { ProviderAdapterService } from '../src/modules/adapters/provider-adapter.service';
import { QueueService } from '../src/modules/queues/queue.service';
import { RateLimitGuard } from '../src/common/rate-limit.guard';

function contextFor(path: string): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        path,
        route: { path },
        headers: { 'x-forwarded-for': '203.0.113.10' }
      })
    })
  } as unknown as ExecutionContext;
}

describe('milestone 5 production readiness hardening', () => {
  it('enforces refresh-token persistence, rotation, session listing, and invalidation in fallback mode', async () => {
    const auth = new AuthService(new JwtService());
    const login = await auth.login('superadmin@example.local', 'ChangeMe-Local-Only-123!');
    if ('twoFactorRequired' in login) throw new Error('Unexpected 2FA challenge.');

    const sessions = await auth.listSessions(login.user.id);
    expect(sessions.sessions).toHaveLength(1);

    const rotated = await auth.refresh(login.refreshToken);
    if ('twoFactorRequired' in rotated) throw new Error('Unexpected 2FA challenge.');
    await expect(auth.refresh(login.refreshToken)).rejects.toThrow(UnauthorizedException);

    const afterRotation = await auth.listSessions(login.user.id);
    expect(afterRotation.sessions.filter((session: { revokedAt?: Date }) => !session.revokedAt)).toHaveLength(1);

    const active = afterRotation.sessions.find((session: { id: string; revokedAt?: Date }) => !session.revokedAt);
    await auth.invalidateSession(login.user.id, active?.id ?? 'missing');
    await expect(auth.refresh(rotated.refreshToken)).rejects.toThrow(UnauthorizedException);
  });

  it('enforces password reset token expiry and one-time-use behavior in fallback mode', async () => {
    const auth = new AuthService(new JwtService());
    const reset = await auth.requestPasswordReset('superadmin@example.local');
    expect(reset.developmentResetToken).toBeDefined();
    await auth.completePasswordReset(reset.developmentResetToken as string, 'New-Local-Password-123!');
    await expect(auth.completePasswordReset(reset.developmentResetToken as string, 'Another-Local-Password-123!')).rejects.toThrow(UnauthorizedException);
    await expect(auth.login('superadmin@example.local', 'ChangeMe-Local-Only-123!')).rejects.toThrow(UnauthorizedException);
    await expect(auth.login('superadmin@example.local', 'New-Local-Password-123!')).resolves.toHaveProperty('accessToken');
  });

  it('supports mock/dev 2FA verification without real secrets', async () => {
    const auth = new AuthService(new JwtService());
    const setup = await auth.beginTwoFactorSetup('mem_super_admin');
    await expect(auth.verifyTwoFactor('mem_super_admin', setup.challengeId, '111111')).rejects.toThrow(UnauthorizedException);
    await expect(auth.verifyTwoFactor('mem_super_admin', setup.challengeId, '000000')).resolves.toMatchObject({ status: 'two_factor_verified' });
  });

  it('rate-limits sensitive endpoint groups', () => {
    const guard = new RateLimitGuard(new Reflector());
    const ctx = contextFor('/auth/login');
    for (let index = 0; index < 5; index += 1) expect(guard.canActivate(ctx)).toBe(true);
    expect(() => guard.canActivate(ctx)).toThrow(HttpException);
  });

  it('keeps queue behavior enqueue-only with no live workers', () => {
    const queues = new QueueService();
    const job = queues.enqueue('notifications', 'send_email', { notificationId: 'not_1' });
    expect(job.liveWorkerStarted).toBe(false);
    expect(queues.contracts()).toMatchObject({ liveWorkersStarted: false, mode: 'mock_enqueue_only' });
  });

  it('exposes health, readiness, and metrics-ready observability contracts', async () => {
    const observability = new ObservabilityService({ $queryRawUnsafe: jest.fn().mockResolvedValue([{ '?column?': 1 }]) } as never);
    expect(observability.health()).toMatchObject({ status: 'ok' });
    await expect(observability.readiness()).resolves.toMatchObject({ status: 'ready' });
    expect(observability.metrics()).toMatchObject({ metricsReady: true });
  });

  it('verifies webhook signatures without using live provider secrets', () => {
    const adapters = new ProviderAdapterService();
    const payload = JSON.stringify({ event: 'payment.authorized' });
    const signingSecret = 'development-signing-secret';
    const signature = createHmac('sha256', signingSecret).update(payload).digest('hex');
    expect(adapters.verifyWebhookSignature({ provider: 'mock-payment', payload, signature, signingSecret })).toMatchObject({
      signatureValid: true,
      liveSecretUsed: false
    });
    expect(adapters.verifyWebhookSignature({ provider: 'mock-payment', payload, signature })).toMatchObject({ signatureValid: false });
  });
});
