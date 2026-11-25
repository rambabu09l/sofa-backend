import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { MasterPermissionEntity } from '../entity/master-permission.entity';

@Injectable()
export class MasterPermissionRepository extends Repository<MasterPermissionEntity> {
  constructor(dataSource: DataSource, manager?: EntityManager) {
    super(MasterPermissionEntity, manager ?? dataSource.createEntityManager());
  }

  findById(id: string): Promise<MasterPermissionEntity | null> {
    return this.findOne({ where: { id } });
  }

  findByCode(code: string): Promise<MasterPermissionEntity | null> {
    return this.findOne({ where: { code } });
  }

  findAll(includeInactive = false): Promise<MasterPermissionEntity[]> {
    return this.find({
      where: includeInactive ? {} : { isActive: true },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }
}
