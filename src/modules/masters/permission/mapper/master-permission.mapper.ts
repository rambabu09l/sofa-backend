import { MasterPermissionResponseDto } from '../dto/response/master-permission.res.dto';
import { MasterPermissionEntity } from '../entity/master-permission.entity';

export function toMasterPermissionResponse(
  entity: MasterPermissionEntity,
): MasterPermissionResponseDto {
  return {
    id: entity.id,
    code: entity.code,
    name: entity.name,
    category: entity.category,
    scope: entity.scope,
    description: entity.description,
    sortOrder: entity.sortOrder,
    isActive: entity.isActive,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
