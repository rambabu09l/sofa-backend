import { Injectable, Logger } from '@nestjs/common';
import { rethrowServiceError } from '../../../common/http/service-error';
import { AccessReadRepository } from '../repository/access-read.repository';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private readonly access: AccessReadRepository) {}

  async listSystemRoleCodes(userId: string): Promise<string[]> {
    try {
      return await this.access.listSystemRoleCodes(userId);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `PermissionsService.listSystemRoleCodes userId=${userId}`,
        'Could not load roles',
      );
    }
  }

  async hasAnySystemPermission(
    userId: string,
    permissionCodes: readonly string[],
  ): Promise<boolean> {
    try {
      return await this.access.userHasAnySystemPermission(
        userId,
        permissionCodes,
      );
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `PermissionsService.hasAnySystemPermission userId=${userId} codes=${permissionCodes.join(',')}`,
        'Could not check permissions',
      );
    }
  }

  async hasSystemPermission(
    userId: string,
    permissionCode: string,
  ): Promise<boolean> {
    return this.hasAnySystemPermission(userId, [permissionCode]);
  }

  async listSystemPermissionCodes(userId: string): Promise<string[]> {
    try {
      return await this.access.listSystemPermissionCodes(userId);
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `PermissionsService.listSystemPermissionCodes userId=${userId}`,
        'Could not load permissions',
      );
    }
  }
}
