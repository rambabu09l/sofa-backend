import { RolePermissionMappingResponseDto } from '../dto/response/role-permission-mapping.res.dto';
import { RolePermissionMappingEntity } from '../entity/role-permission-mapping.entity';

export function toRolePermissionMappingResponse(
  entity: RolePermissionMappingEntity,
): RolePermissionMappingResponseDto {
  return {
    roleId: entity.roleId,
    permissionId: entity.permissionId,
  };
}
