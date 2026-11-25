import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { UserEntity } from '../entity/user.entity';

@Injectable()
export class UserRepository extends Repository<UserEntity> {
  constructor(dataSource: DataSource, manager?: EntityManager) {
    super(UserEntity, manager ?? dataSource.createEntityManager());
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.findOne({ where: { id } });
  }

  findByIds(ids: string[]): Promise<UserEntity[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.find({ where: { id: In(ids) } });
  }

  findByEmailNormalized(emailNormalized: string): Promise<UserEntity | null> {
    return this.findOne({ where: { emailNormalized } });
  }

  findByAuthUserId(authUserId: string): Promise<UserEntity | null> {
    return this.findOne({ where: { authUserId } });
  }
}
