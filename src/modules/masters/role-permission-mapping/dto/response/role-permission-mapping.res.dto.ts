import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RolePermissionMappingResponseDto {
  @ApiProperty({ example: '1' })
  @IsString({ message: 'Role id must be a string' })
  roleId!: string;

  @ApiProperty({ example: '2' })
  @IsString({ message: 'Permission id must be a string' })
  permissionId!: string;
}
