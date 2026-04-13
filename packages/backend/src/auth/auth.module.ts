import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './controller/auth.controller';
import { AuthApplication } from './application/auth.application';
import { AuthService } from './service/auth.service';
import { AUTH_REPOSITORY } from './repository/auth.repository';
import { AuthPrismaRepository } from './repository-impl/auth.prisma.repository';
import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthApplication,
    AuthService,
    JwtStrategy,
    {
      provide: AUTH_REPOSITORY,
      useClass: AuthPrismaRepository,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
