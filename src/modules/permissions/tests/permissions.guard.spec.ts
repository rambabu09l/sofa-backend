import {
  CanActivate,
  Controller,
  ExecutionContext,
  Get,
  HttpStatus,
  INestApplication,
  Injectable,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { Public } from '../../../common/decorators/public.decorator';
import { AllowUnprovisionedSession } from '../../auth/decorators/allow-unprovisioned-session.decorator';
import type { AuthUser } from '../../auth/types/auth-user';
import { AllowAuthenticated } from '../decorators/allow-authenticated.decorator';
import { RequirePermission } from '../decorators/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { PermissionCode } from '../helpers/master-permissions';
import { PermissionsService } from '../service/permissions.service';

@Controller('probe')
class ProbeController {
  @Get('open')
  open() {
    return { ok: true };
  }

  @Get('authenticated')
  @AllowAuthenticated()
  authenticated() {
    return { ok: true };
  }

  @Get('unprovisioned')
  @AllowAuthenticated()
  @AllowUnprovisionedSession()
  unprovisioned() {
    return { ok: true };
  }

  @Public()
  @Get('public')
  publicRoute() {
    return { ok: true };
  }

  @Get('roles')
  @RequirePermission(PermissionCode.ROLE_VIEW)
  viewRoles() {
    return { ok: true };
  }

  @Post('roles')
  @RequirePermission(PermissionCode.ROLE_CREATE)
  createRoles() {
    return { ok: true };
  }

  @Get('either')
  @RequirePermission(PermissionCode.ROLE_VIEW, PermissionCode.ROLE_CREATE)
  either() {
    return { ok: true };
  }
}

describe('PermissionsGuard', () => {
  let app: INestApplication<App>;
  let hasAnySystemPermission: jest.Mock;

  const viewer: AuthUser = {
    id: '1',
    email: 'viewer@example.com',
    displayName: 'Viewer',
    avatarUrl: null,
    emailVerified: true,
    roles: [],
    appRole: 'member',
    tokenExp: Math.floor(Date.now() / 1000) + 3600,
  };

  @Injectable()
  class TestAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context
        .switchToHttp()
        .getRequest<{ headers: Record<string, unknown>; user?: AuthUser }>();
      const userId = req.headers['x-test-user'] as string | undefined;
      if (!userId) {
        // Public routes still reach PermissionsGuard without a user.
        return true;
      }
      req.user = { ...viewer, id: userId };
      return true;
    }
  }

  beforeEach(async () => {
    hasAnySystemPermission = jest.fn();

    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
      providers: [
        Reflector,
        {
          provide: PermissionsService,
          useValue: {
            hasAnySystemPermission,
            hasSystemPermission: jest.fn(),
            listSystemPermissionCodes: jest.fn().mockResolvedValue([]),
            listSystemRoleCodes: jest.fn().mockResolvedValue([]),
          },
        },
        PermissionsGuard,
        { provide: APP_GUARD, useClass: TestAuthGuard },
        { provide: APP_GUARD, useClass: PermissionsGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('denies routes without an authz declaration', async () => {
    await request(app.getHttpServer())
      .get('/probe/open')
      .set('x-test-user', '1')
      .expect(HttpStatus.FORBIDDEN);
    expect(hasAnySystemPermission).not.toHaveBeenCalled();
  });

  it('allows @AllowAuthenticated when a user is present', async () => {
    await request(app.getHttpServer())
      .get('/probe/authenticated')
      .set('x-test-user', '1')
      .expect(HttpStatus.OK);
    expect(hasAnySystemPermission).not.toHaveBeenCalled();
  });

  it('returns 403 for @AllowAuthenticated when the user is missing', async () => {
    await request(app.getHttpServer())
      .get('/probe/authenticated')
      .expect(HttpStatus.FORBIDDEN);
  });

  it('allows @AllowAuthenticated + @AllowUnprovisionedSession without a Sofa user', async () => {
    await request(app.getHttpServer())
      .get('/probe/unprovisioned')
      .expect(HttpStatus.OK);
    expect(hasAnySystemPermission).not.toHaveBeenCalled();
  });

  it('allows @Public without permission codes or a user', async () => {
    await request(app.getHttpServer())
      .get('/probe/public')
      .expect(HttpStatus.OK);
    expect(hasAnySystemPermission).not.toHaveBeenCalled();
  });

  it('returns 403 when the user is missing on a guarded route', async () => {
    await request(app.getHttpServer())
      .get('/probe/roles')
      .expect(HttpStatus.FORBIDDEN);
  });

  it('returns 403 when the user lacks the required permission', async () => {
    hasAnySystemPermission.mockResolvedValue(false);

    await request(app.getHttpServer())
      .get('/probe/roles')
      .set('x-test-user', '1')
      .expect(HttpStatus.FORBIDDEN);

    expect(hasAnySystemPermission).toHaveBeenCalledWith('1', [
      PermissionCode.ROLE_VIEW,
    ]);
  });

  it('allows when hasAnySystemPermission returns true', async () => {
    hasAnySystemPermission.mockResolvedValue(true);

    await request(app.getHttpServer())
      .post('/probe/roles')
      .set('x-test-user', '1')
      .expect(HttpStatus.CREATED);

    expect(hasAnySystemPermission).toHaveBeenCalledWith('1', [
      PermissionCode.ROLE_CREATE,
    ]);
  });

  it('allows any-of when the user has the second required code', async () => {
    hasAnySystemPermission.mockResolvedValue(true);

    await request(app.getHttpServer())
      .get('/probe/either')
      .set('x-test-user', '1')
      .expect(HttpStatus.OK);

    expect(hasAnySystemPermission).toHaveBeenCalledWith('1', [
      PermissionCode.ROLE_VIEW,
      PermissionCode.ROLE_CREATE,
    ]);
  });

  it('returns 403 for any-of when the user has none of the codes', async () => {
    hasAnySystemPermission.mockResolvedValue(false);

    await request(app.getHttpServer())
      .get('/probe/either')
      .set('x-test-user', '1')
      .expect(HttpStatus.FORBIDDEN);
  });
});