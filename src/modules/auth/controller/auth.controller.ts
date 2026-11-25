import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { SessionContainer } from 'supertokens-node/recipe/session';
import { ApiAuth } from '../../../common/decorators/api-auth.decorator';
import { ApiOkEnvelope } from '../../../common/decorators/api-envelope.decorator';
import { ApiMessage } from '../../../common/decorators/api-message.decorator';
import { AllowUnprovisionedSession } from '../decorators/allow-unprovisioned-session.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { StSession } from '../decorators/st-session.decorator';
import { CompleteSocialSignupDto } from '../dto/request/complete-social-signup.req.dto';
import { CurrentUserResponseDto } from '../dto/response/auth.res.dto';
import { SocialProvisioningStatusDto } from '../dto/response/social-provisioning.res.dto';
import { AuthService } from '../service/auth.service';
import type { AuthUser } from '../types/auth-user';
import { AllowAuthenticated } from '../../permissions/decorators/allow-authenticated.decorator';

/**
 * Sofa profile under `/api/v1/auth/*`.
 * SuperTokens recipe APIs stay at root `/auth/*` (Express middleware) — no path clash.
 */
@ApiTags('auth')
@AllowAuthenticated()
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @ApiAuth()
  @Get('me')
  @ApiMessage('Current user retrieved')
  @ApiOperation({
    summary: 'Current authenticated user',
    description:
      'Requires a SuperTokens session cookie (SPA) or header session (extension).',
  })
  @ApiOkEnvelope(CurrentUserResponseDto)
  getMe(@CurrentUser() user: AuthUser) {
    return this.auth.getMe(user);
  }

  @ApiAuth()
  @AllowUnprovisionedSession()
  @Get('social-provisioning')
  @ApiMessage('Social provisioning status retrieved')
  @ApiOperation({
    summary: 'Whether the SuperTokens session already has a Sofa user',
    description:
      'Used after Google OAuth callback. Session required; Sofa user optional.',
  })
  @ApiOkEnvelope(SocialProvisioningStatusDto)
  getSocialProvisioning(@StSession() session: SessionContainer) {
    return this.auth.getSocialProvisioningStatus(session.getUserId());
  }

  @ApiAuth()
  @AllowUnprovisionedSession()
  @Post('complete-social-signup')
  @ApiMessage('Account created')
  @ApiOperation({
    summary: 'Finish Google signup',
    description:
      'Call after ThirdParty sign-in when the user still needs a Sofa user.',
  })
  @ApiOkEnvelope(CurrentUserResponseDto)
  completeSocialSignup(
    @StSession() session: SessionContainer,
    @Body() body: CompleteSocialSignupDto,
  ) {
    return this.auth.completeSocialSignup(session, body);
  }
}