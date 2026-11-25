import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { superTokensHooks } from '../../../config/supertokens-hooks';
import { ensureSuperTokensAppRoles } from '../../../config/supertokens-roles';
import { AuthService } from './auth.service';

/**
 * Wires Nest DI into SuperTokens recipe overrides after the app module graph is ready.
 * Also ensures SuperTokens role definitions (`superadmin|owner|member`) exist.
 */
@Injectable()
export class SuperTokensHooksService implements OnModuleInit {
  private readonly logger = new Logger(SuperTokensHooksService.name);

  constructor(private readonly auth: AuthService) {}

  async onModuleInit(): Promise<void> {
    superTokensHooks.auth = this.auth;
    try {
      await ensureSuperTokensAppRoles();
    } catch (error) {
      this.logger.error(
        'Could not ensure SuperTokens app roles (superadmin|owner|member)',
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}