import { RoleMenuMappingResponseDto } from '../dto/response/role-menu-mapping.res.dto';
import { RoleMenuMappingEntity } from '../entity/role-menu-mapping.entity';

export function toRoleMenuMappingResponse(
  entity: RoleMenuMappingEntity,
): RoleMenuMappingResponseDto {
  return {
    roleId: entity.roleId,
    menuId: entity.menuId,
  };
}
