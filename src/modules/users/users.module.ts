import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSystemRoleMappingEntity } from './entity/user-system-role-mapping.entity';
import { UserEntity } from './entity/user.entity';
import { UserRepository } from './repository/user.repository';
import { UsersService } from './service/users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, UserSystemRoleMappingEntity]),
  ],
  providers: [UserRepository, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
