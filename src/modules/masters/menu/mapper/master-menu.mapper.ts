import { MasterMenuResponseDto } from '../dto/response/master-menu.res.dto';
import { MasterMenuEntity } from '../entity/master-menu.entity';

export function toMasterMenuResponse(
  entity: MasterMenuEntity,
): MasterMenuResponseDto {
  return {
    id: entity.id,
    parentId: entity.parentId,
    code: entity.code,
    name: entity.name,
    route: entity.route,
    icon: entity.icon,
    scope: entity.scope,
    sortOrder: entity.sortOrder,
    isActive: entity.isActive,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
