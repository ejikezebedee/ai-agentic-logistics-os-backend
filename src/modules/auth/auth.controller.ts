import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { Actor, Public, RequestActor } from '../../common/auth.decorators';
import { LoginDto, PasswordResetCompleteDto, PasswordResetRequestDto, RefreshTokenDto, TwoFactorVerifyDto } from '../../common/dto';
import { RateLimit } from '../../common/rate-limit.decorator';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @RateLimit({ limit: 5, windowMs: 60_000, keyPrefix: 'auth-login' })
  @ApiBody({ type: LoginDto })
  login(@Body() body: LoginDto) {
    return this.auth.login(body.email, body.password, body.twoFactorCode);
  }

  @Public()
  @Post('refresh')
  @RateLimit({ limit: 10, windowMs: 60_000, keyPrefix: 'auth-refresh' })
  @ApiBody({ type: RefreshTokenDto })
  refresh(@Body() body: RefreshTokenDto) {
    return this.auth.refresh(body.refreshToken);
  }

  @Post('logout')
  @ApiBody({ type: RefreshTokenDto })
  logout(@Body() body: RefreshTokenDto) {
    return this.auth.logout(body.refreshToken);
  }

  @Public()
  @Post('password-reset/request')
  @RateLimit({ limit: 3, windowMs: 15 * 60_000, keyPrefix: 'password-reset-request' })
  @ApiBody({ type: PasswordResetRequestDto })
  requestPasswordReset(@Body() body: PasswordResetRequestDto) {
    return this.auth.requestPasswordReset(body.email);
  }

  @Public()
  @Post('password-reset/complete')
  @RateLimit({ limit: 5, windowMs: 15 * 60_000, keyPrefix: 'password-reset-complete' })
  @ApiBody({ type: PasswordResetCompleteDto })
  completePasswordReset(@Body() body: PasswordResetCompleteDto) {
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
  @ApiBody({ type: TwoFactorVerifyDto })
  verifyTwoFactor(@Actor() actor: RequestActor, @Body() body: TwoFactorVerifyDto) {
    return this.auth.verifyTwoFactor(actor.id, body.challengeId, body.code);
  }
}
