import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  INestApplication,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { AuthUser } from '../../../auth/types/auth-user';
import { PermissionsGuard } from '../../../permissions/guards/permissions.guard';
import { PermissionCode } from '../../../permissions/helpers/master-permissions';
import { PermissionsService } from '../../../permissions/service/permissions.service';
import { MasterRoleController } from '../controller/master-role.controller';
import { MasterRoleService } from '../service/master-role.service';

describe('MasterRoleController permissions', () => {
  let app: INestApplication<App>;
  let hasAnySystemPermission: jest.Mock;
  let list: jest.Mock;
  let create: jest.Mock;

  const user: AuthUser = {
    id: '42',
    email: 'admin@example.com',
    displayName: 'Admin',
    avatarUrl: null,
    emailVerified: true,
    roles: [],
    appRole: 'owner',
    tokenExp: Math.floor(Date.now() / 1000) + 3600,
  };

  @Injectable()
  class TestAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context
        .switchToHttp()
        .getRequest<{ headers: Record<string, unknown>; user?: AuthUser }>();
      if (!req.headers['x-test-user']) {
        throw new UnauthorizedException('Please sign in to continue');
      }
      req.user = user;
      return true;
    }
  }

  beforeEach(async () => {
    hasAnySystemPermission = jest.fn();
    list = jest.fn().mockResolvedValue([]);
    create = jest.fn().mockResolvedValue({
      id: '1',
      code: 'CUSTOM',
      name: 'Custom',
      scope: 'SYSTEM',
      description: null,
      isSystem: false,
      isAssignable: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [MasterRoleController],
      providers: [
        Reflector,
        {
          provide: MasterRoleService,
          useValue: {
            list,
            getById: jest.fn(),
            create,
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
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

  it('requires ROLE_VIEW for GET list', async () => {
    hasAnySystemPermission.mockImplementation(
      async (_userId: string, codes: string[]) =>
        codes.includes(PermissionCode.ROLE_VIEW),
    );

    await request(app.getHttpServer())
      .get('/masters/roles')
      .set('x-test-user', '42')
      .expect(HttpStatus.OK);

    expect(hasAnySystemPermission).toHaveBeenCalledWith('42', [
      PermissionCode.ROLE_VIEW,
    ]);
    expect(list).toHaveBeenCalled();
  });

  it('rejects GET list without ROLE_VIEW', async () => {
    hasAnySystemPermission.mockResolvedValue(false);

    await request(app.getHttpServer())
      .get('/masters/roles')
      .set('x-test-user', '42')
      .expect(HttpStatus.FORBIDDEN);

    expect(list).not.toHaveBeenCalled();
  });

  it('requires ROLE_CREATE for POST create', async () => {
    hasAnySystemPermission.mockImplementation(
      async (_userId: string, codes: string[]) =>
        codes.includes(PermissionCode.ROLE_CREATE),
    );

    await request(app.getHttpServer())
      .post('/masters/roles')
      .set('x-test-user', '42')
      .send({
        code: 'CUSTOM',
        name: 'Custom',
        scope: 'SYSTEM',
      })
      .expect(HttpStatus.CREATED);

    expect(hasAnySystemPermission).toHaveBeenCalledWith('42', [
      PermissionCode.ROLE_CREATE,
    ]);
    expect(create).toHaveBeenCalled();
  });

  it('rejects POST create when user only has VIEW', async () => {
    hasAnySystemPermission.mockImplementation(
      async (_userId: string, codes: string[]) =>
        codes.includes(PermissionCode.ROLE_VIEW),
    );

    await request(app.getHttpServer())
      .post('/masters/roles')
      .set('x-test-user', '42')
      .send({
        code: 'CUSTOM',
        name: 'Custom',
        scope: 'SYSTEM',
      })
      .expect(HttpStatus.FORBIDDEN);

    expect(create).not.toHaveBeenCalled();
  });
});
