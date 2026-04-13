import { Module } from '@nestjs/common';
import { UsersController } from './controller/users.controller';
import { UsersApplication } from './application/users.application';
import { UsersService } from './service/users.service';
import { USERS_REPOSITORY } from './repository/users.repository';
import { UsersPrismaRepository } from './repository-impl/users.prisma.repository';

@Module({
  controllers: [UsersController],
  providers: [
    UsersApplication,
    UsersService,
    {
      provide: USERS_REPOSITORY,
      useClass: UsersPrismaRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
