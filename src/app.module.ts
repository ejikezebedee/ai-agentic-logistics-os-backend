import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { APP_FILTER } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { CoreModule } from './core.module';
import { JwtAuthGuard } from './common/jwt-auth.guard';
import { RateLimitGuard } from './common/rate-limit.guard';
import { RolesGuard } from './common/roles.guard';
import { HttpErrorEnvelopeFilter } from './common/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({ global: true }),
    CoreModule
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpErrorEnvelopeFilter },
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard }
  ]
})
export class AppModule {}
