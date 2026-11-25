import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';

@Entity({ name: 'users' })
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** SuperTokens user id — authentication identity lives in SuperTokens Core. */
  @Column({
    name: 'auth_user_id',
    type: 'varchar',
    length: 128,
    unique: true,
    nullable: true,
  })
  authUserId!: string | null;

  @Column({ type: 'varchar', length: 320 })
  email!: string;

  @Column({
    name: 'email_normalized',
    type: 'varchar',
    length: 320,
    unique: true,
  })
  emailNormalized!: string;

  @Column({ name: 'display_name', type: 'varchar', length: 160 })
  displayName!: string;

  @Column({
    name: 'avatar_url',
    type: 'varchar',
    length: 2048,
    nullable: true,
  })
  avatarUrl!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({
    name: 'last_login_at',
    type: 'datetime',
    precision: 3,
    nullable: true,
  })
  lastLoginAt!: Date | null;
}
