import { MasterRoleResponseDto } from '../dto/response/master-role.res.dto';
import { MasterRoleEntity } from '../entity/master-role.entity';

export function toMasterRoleResponse(
  entity: MasterRoleEntity,
): MasterRoleResponseDto {
  return {
    id: entity.id,
    code: entity.code,
    name: entity.name,
    scope: entity.scope,
    description: entity.description,
    isSystem: entity.isSystem,
    isAssignable: entity.isAssignable,
    isActive: entity.isActive,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
