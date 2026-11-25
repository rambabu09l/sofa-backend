import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '../../../../database/entities/base.entity';
import { MasterPermissionEntity } from '../../permission/entity/master-permission.entity';
import { MasterPermissionScope } from '../../permission/enum/master-permission.enums';
import { MasterRoleEntity } from '../../role/entity/master-role.entity';

@Entity({ name: 'role_permission_mapping' })
@Index('ix_role_permission_mapping_permission', ['permissionId'])
export class RolePermissionMappingEntity extends BaseEntity {
  @PrimaryColumn({ name: 'role_id', type: 'bigint', unsigned: true })
  roleId!: string;

  @PrimaryColumn({ name: 'permission_id', type: 'bigint', unsigned: true })
  permissionId!: string;

  /** Must match both the master role scope and the permission scope (DB FKs). */
  @Column({ type: 'enum', enum: MasterPermissionScope })
  scope!: MasterPermissionScope;

  @ManyToOne(() => MasterRoleEntity, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn([
    { name: 'role_id', referencedColumnName: 'id' },
    { name: 'scope', referencedColumnName: 'scope' },
  ])
  role!: MasterRoleEntity;

  @ManyToOne(() => MasterPermissionEntity, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn([
    { name: 'permission_id', referencedColumnName: 'id' },
    { name: 'scope', referencedColumnName: 'scope' },
  ])
  permission!: MasterPermissionEntity;
}
