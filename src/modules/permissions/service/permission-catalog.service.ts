import { Injectable, Logger } from '@nestjs/common';
import { rethrowServiceError } from '../../../common/http/service-error';
import { MasterPermissionScope } from '../../masters/permission/enum/master-permission.enums';
import { MasterPermissionRepository } from '../../masters/permission/repository/master-permission.repository';
import type { PermissionCatalogScopeQuery } from '../constants/permission-catalog.constants';
import { PermissionCatalogResponseDto } from '../dto/response/permission-catalog.res.dto';

@Injectable()
export class PermissionCatalogService {
  private readonly logger = new Logger(PermissionCatalogService.name);

  constructor(private readonly permissions: MasterPermissionRepository) {}

  async listByScope(
    scopeQuery: PermissionCatalogScopeQuery,
  ): Promise<PermissionCatalogResponseDto[]> {
    try {
      const dbScope = this.toDbScope(scopeQuery);
      const rows = await this.permissions.find({
        where: { scope: dbScope, isActive: true },
        order: { sortOrder: 'ASC', id: 'ASC' },
      });
      return rows.map((row) => ({
        code: row.code,
        scope: this.toApiScope(row.scope),
        category: row.category,
        name: row.name,
        description: row.description,
        sortOrder: row.sortOrder,
      }));
    } catch (error) {
      rethrowServiceError(
        error,
        this.logger,
        `PermissionCatalogService.listByScope scope=${scopeQuery}`,
        'Could not load permissions',
      );
    }
  }

  private toDbScope(scope: PermissionCatalogScopeQuery): MasterPermissionScope {
    if (scope === 'ORG' || scope === 'ORGANIZATION') {
      return MasterPermissionScope.ORGANIZATION;
    }
    if (scope === 'PROJECT') {
      return MasterPermissionScope.PROJECT;
    }
    return MasterPermissionScope.SYSTEM;
  }

  private toApiScope(
    scope: MasterPermissionScope,
  ): PermissionCatalogResponseDto['scope'] {
    if (scope === MasterPermissionScope.ORGANIZATION) return 'ORG';
    if (scope === MasterPermissionScope.PROJECT) return 'PROJECT';
    return 'SYSTEM';
  }
}
