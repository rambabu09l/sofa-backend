import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../../../database/entities/base.entity';
import { MasterRoleScope } from '../enum/master-role.enums';

@Entity({ name: 'master_roles' })
@Index('ix_master_roles_scope_active', ['scope', 'isActive'])
@Index('uq_master_roles_id_scope', ['id', 'scope'], { unique: true })
export class MasterRoleEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Index('uq_master_roles_code', { unique: true })
  @Column({ type: 'varchar', length: 64 })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'enum', enum: MasterRoleScope })
  scope!: MasterRoleScope;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description!: string | null;

  @Column({ name: 'is_system', type: 'boolean', default: true })
  isSystem!: boolean;

  @Column({ name: 'is_assignable', type: 'boolean', default: false })
  isAssignable!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
