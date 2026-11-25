import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../../../database/entities/base.entity';
import { MasterPermissionScope } from '../enum/master-permission.enums';

@Entity({ name: 'master_permissions' })
@Index('ix_permission_scope_category', ['scope', 'category', 'isActive'])
@Index('uq_master_permissions_id_scope', ['id', 'scope'], { unique: true })
export class MasterPermissionEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Index('uq_master_permissions_code', { unique: true })
  @Column({ type: 'varchar', length: 100 })
  code!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 64 })
  category!: string;

  @Column({ type: 'enum', enum: MasterPermissionScope })
  scope!: MasterPermissionScope;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description!: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
