import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { RolePermissionMappingEntity } from '../entity/role-permission-mapping.entity';

@Injectable()
export class RolePermissionMappingRepository extends Repository<RolePermissionMappingEntity> {
  constructor(dataSource: DataSource, manager?: EntityManager) {
    super(
      RolePermissionMappingEntity,
      manager ?? dataSource.createEntityManager(),
    );
  }

  findAll(): Promise<RolePermissionMappingEntity[]> {
    return this.find({ order: { roleId: 'ASC', permissionId: 'ASC' } });
  }

  findByRoleId(roleId: string): Promise<RolePermissionMappingEntity[]> {
    return this.find({
      where: { roleId },
      order: { permissionId: 'ASC' },
    });
  }

  findOneMapping(
    roleId: string,
    permissionId: string,
  ): Promise<RolePermissionMappingEntity | null> {
    return this.findOne({ where: { roleId, permissionId } });
  }
}
