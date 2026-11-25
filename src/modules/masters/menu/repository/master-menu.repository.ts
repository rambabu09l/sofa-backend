import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { MasterMenuEntity } from '../entity/master-menu.entity';

@Injectable()
export class MasterMenuRepository extends Repository<MasterMenuEntity> {
  constructor(dataSource: DataSource, manager?: EntityManager) {
    super(MasterMenuEntity, manager ?? dataSource.createEntityManager());
  }

  findById(id: string): Promise<MasterMenuEntity | null> {
    return this.findOne({ where: { id } });
  }

  findByCode(code: string): Promise<MasterMenuEntity | null> {
    return this.findOne({ where: { code } });
  }

  findAll(includeInactive = false): Promise<MasterMenuEntity[]> {
    return this.find({
      where: includeInactive ? {} : { isActive: true },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }
}
