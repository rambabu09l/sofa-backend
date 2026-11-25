import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { MasterRoleEntity } from '../entity/master-role.entity';

@Injectable()
export class MasterRoleRepository extends Repository<MasterRoleEntity> {
  constructor(dataSource: DataSource, manager?: EntityManager) {
    super(MasterRoleEntity, manager ?? dataSource.createEntityManager());
  }

  findById(id: string): Promise<MasterRoleEntity | null> {
    return this.findOne({ where: { id } });
  }

  findByCode(code: string): Promise<MasterRoleEntity | null> {
    return this.findOne({ where: { code } });
  }

  findAll(includeInactive = false): Promise<MasterRoleEntity[]> {
    return this.find({
      where: includeInactive ? {} : { isActive: true },
      order: { id: 'ASC' },
    });
  }
}
