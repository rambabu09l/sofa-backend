import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '../../../../database/entities/base.entity';
import { MasterMenuEntity } from '../../menu/entity/master-menu.entity';
import { MasterRoleEntity } from '../../role/entity/master-role.entity';

@Entity({ name: 'role_menu_mapping' })
@Index('ix_role_menu_mapping_menu', ['menuId'])
export class RoleMenuMappingEntity extends BaseEntity {
  @PrimaryColumn({ name: 'role_id', type: 'bigint', unsigned: true })
  roleId!: string;

  @PrimaryColumn({ name: 'menu_id', type: 'bigint', unsigned: true })
  menuId!: string;

  @ManyToOne(() => MasterRoleEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: MasterRoleEntity;

  @ManyToOne(() => MasterMenuEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu!: MasterMenuEntity;
}
