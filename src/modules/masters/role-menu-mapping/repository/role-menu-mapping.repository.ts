import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { RoleMenuMappingEntity } from '../entity/role-menu-mapping.entity';

@Injectable()
export class RoleMenuMappingRepository extends Repository<RoleMenuMappingEntity> {
  constructor(dataSource: DataSource, manager?: EntityManager) {
    super(RoleMenuMappingEntity, manager ?? dataSource.createEntityManager());
  }

  findAll(): Promise<RoleMenuMappingEntity[]> {
    return this.find({ order: { roleId: 'ASC', menuId: 'ASC' } });
  }

  findByRoleId(roleId: string): Promise<RoleMenuMappingEntity[]> {
    return this.find({
      where: { roleId },
      order: { menuId: 'ASC' },
    });
  }

  findOneMapping(
    roleId: string,
    menuId: string,
  ): Promise<RoleMenuMappingEntity | null> {
    return this.findOne({ where: { roleId, menuId } });
  }
}
