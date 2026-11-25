import { Module, forwardRef } from '@nestjs/common';
import { PermissionsModule } from '../permissions/permissions.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './controller/auth.controller';
import { SofaSessionUserGuard } from './guards/sofa-session-user.guard';
import { AuthService } from './service/auth.service';
import { SuperTokensHooksService } from './service/supertokens-hooks.service';

@Module({
  imports: [forwardRef(() => UsersModule), PermissionsModule],
  controllers: [AuthController],
  providers: [AuthService, SofaSessionUserGuard, SuperTokensHooksService],
  exports: [AuthService, SofaSessionUserGuard],
})
export class AuthModule {}