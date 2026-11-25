import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class CreateRolePermissionMappingDto {
  @ApiProperty({ example: '1' })
  @IsString({ message: 'roleId must be a string' })
  @Matches(/^\d+$/, { message: 'roleId must be a numeric id' })
  roleId!: string;

  @ApiProperty({ example: '2' })
  @IsString({ message: 'permissionId must be a string' })
  @Matches(/^\d+$/, { message: 'permissionId must be a numeric id' })
  permissionId!: string;
}
