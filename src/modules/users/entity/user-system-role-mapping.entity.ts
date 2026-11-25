import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { MasterRoleEntity } from '../../masters/role/entity/master-role.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'user_system_role_mapping' })
export class UserSystemRoleMappingEntity extends BaseEntity {
  @PrimaryColumn({ name: 'user_id', type: 'char', length: 36 })
  userId!: string;

  @PrimaryColumn({ name: 'role_id', type: 'bigint', unsigned: true })
  roleId!: string;

  @Column({ name: 'granted_by', type: 'char', length: 36, nullable: true })
  grantedBy!: string | null;

  @Column({
    name: 'granted_at',
    type: 'datetime',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(3)',
  })
  grantedAt!: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @ManyToOne(() => MasterRoleEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: MasterRoleEntity;
}
