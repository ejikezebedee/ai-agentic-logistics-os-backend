import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor, Public, RequestActor } from '../../common/auth.decorators';
import { RateLimit } from '../../common/rate-limit.decorator';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @RateLimit({ limit: 5, windowMs: 60_000, keyPrefix: 'auth-login' })
  login(@Body() body: { email: string; password: string; twoFactorCode?: string }) {
    return this.auth.login(body.email, body.password, body.twoFactorCode);
  }

  @Public()
  @Post('refresh')
  @RateLimit({ limit: 10, windowMs: 60_000, keyPrefix: 'auth-refresh' })
  refresh(@Body() body: { refreshToken: string }) {
    return this.auth.refresh(body.refreshToken);
  }

  @Post('logout')
  logout(@Body() body: { refreshToken: string }) {
    return this.auth.logout(body.refreshToken);
  }

  @Public()
  @Post('password-reset/request')
  @RateLimit({ limit: 3, windowMs: 15 * 60_000, keyPrefix: 'password-reset-request' })
  requestPasswordReset(@Body() body: { email: string }) {
    return this.auth.requestPasswordReset(body.email);
  }

  @Public()
  @Post('password-reset/complete')
  @RateLimit({ limit: 5, windowMs: 15 * 60_000, keyPrefix: 'password-reset-complete' })
  completePasswordReset(@Body() body: { token: string; newPassword: string }) {
    return this.auth.completePasswordReset(body.token, body.newPassword);
  }

  @Get('sessions')
  sessions(@Actor() actor: RequestActor) {
    return this.auth.listSessions(actor.id);
  }

  @Delete('sessions/:id')
  invalidateSession(@Actor() actor: RequestActor, @Param('id') id: string) {
    return this.auth.invalidateSession(actor.id, id);
  }

  @Post('2fa/setup')
  beginTwoFactorSetup(@Actor() actor: RequestActor) {
    return this.auth.beginTwoFactorSetup(actor.id);
  }

  @Post('2fa/verify')
  verifyTwoFactor(@Actor() actor: RequestActor, @Body() body: { challengeId: string; code: string }) {
    return this.auth.verifyTwoFactor(actor.id, body.challengeId, body.code);
  }
}
