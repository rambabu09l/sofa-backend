import { ApiProperty } from '@nestjs/swagger';

export class CurrentUserResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' })
  id!: string;

  @ApiProperty({ example: 'ada@example.com' })
  email!: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  displayName!: string;

  @ApiProperty({
    nullable: true,
    example: 'https://lh3.googleusercontent.com/a/example',
    description: 'Profile photo URL (e.g. from Google) when available',
  })
  avatarUrl!: string | null;

  @ApiProperty({ example: true })
  emailVerified!: boolean;

  @ApiProperty({
    type: [String],
    example: ['SUPERADMIN'],
    description: 'App system role codes from user_system_role_mapping',
  })
  roles!: string[];

  @ApiProperty({
    enum: ['superadmin', 'owner', 'member'],
    nullable: true,
    example: 'owner',
    description:
      'Coarse role from SuperTokens UserRoles (`st-role`). Permissions stay in MySQL.',
  })
  appRole!: 'superadmin' | 'owner' | 'member' | null;

  @ApiProperty({
    type: [String],
    example: ['ROLE_VIEW', 'ROLE_CREATE'],
    description: 'Resolved SYSTEM permission codes from app roles (MySQL)',
  })
  permissions!: string[];
}
