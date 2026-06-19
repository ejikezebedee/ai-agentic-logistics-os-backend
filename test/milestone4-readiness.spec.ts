import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/modules/auth/auth.service';
import { ProviderAdapterService } from '../src/modules/adapters/provider-adapter.service';
import { RoleCode } from '../src/common/domain.enums';

describe('milestone 4 production persistence and adapter readiness', () => {
  it('verifies credentials, persists refresh sessions in fallback mode, rotates tokens, and invalidates logout sessions', async () => {
    const auth = new AuthService(new JwtService());
    const login = await auth.login('superadmin@example.local', 'ChangeMe-Local-Only-123!');
    if ('twoFactorRequired' in login) throw new Error('Unexpected 2FA challenge for fallback test user.');
    expect(login.accessToken).toBeDefined();
    expect(login.refreshToken).toBeDefined();
    expect(login.user.roles).toContain(RoleCode.SUPER_ADMIN);

    const rotated = await auth.refresh(login.refreshToken);
    if ('twoFactorRequired' in rotated) throw new Error('Unexpected 2FA challenge during refresh.');
    expect(rotated.refreshToken).not.toBe(login.refreshToken);
    await expect(auth.refresh(login.refreshToken)).rejects.toThrow(UnauthorizedException);

    await auth.logout(rotated.refreshToken);
    await expect(auth.refresh(rotated.refreshToken)).rejects.toThrow(UnauthorizedException);
  });

  it('exposes password-reset and 2FA-ready flows without requiring real secrets', async () => {
    const auth = new AuthService(new JwtService());
    const reset = await auth.requestPasswordReset('superadmin@example.local');
    expect(reset.status).toBe('accepted');
    await expect(auth.completePasswordReset('development-token', 'short')).rejects.toThrow('Password must be at least 12 characters.');
    await expect(auth.beginTwoFactorSetup('user_1')).resolves.toMatchObject({ status: 'two_factor_setup_ready' });
  });

  it('keeps all external providers on explicit mock/dev adapters', () => {
    const adapters = new ProviderAdapterService();
    expect(adapters.health().every((adapter) => adapter.mode === 'mock' && adapter.liveConnection === false)).toBe(true);
    expect(adapters.payment.authorize({ orderId: 'ord_1', amount: 10, currency: 'EUR' }).liveMovement).toBe(false);
    expect(adapters.carrier.createShipment({ shipmentId: 'ship_1' }).liveBooking).toBe(false);
    expect(adapters.erp.postLedgerEvent({ referenceId: 'led_1', amount: 10, currency: 'EUR' }).livePosting).toBe(false);
  });
});
