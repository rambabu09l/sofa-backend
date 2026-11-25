import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../../../database/entities/base.entity';
import { MasterMenuScope } from '../enum/master-menu.enums';

@Entity({ name: 'master_menu' })
@Index('ix_master_menu_scope_active', ['scope', 'isActive'])
export class MasterMenuEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Index('ix_master_menu_parent')
  @Column({ name: 'parent_id', type: 'bigint', unsigned: true, nullable: true })
  parentId!: string | null;

  @Index('uq_master_menu_code', { unique: true })
  @Column({ type: 'varchar', length: 80 })
  code!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  route!: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  icon!: string | null;

  @Column({ type: 'enum', enum: MasterMenuScope })
  scope!: MasterMenuScope;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @ManyToOne(() => MasterMenuEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' })
  parent!: MasterMenuEntity | null;
}
