import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class CreateRoleMenuMappingDto {
  @ApiProperty({ example: '1' })
  @IsString({ message: 'roleId must be a string' })
  @Matches(/^\d+$/, { message: 'roleId must be a numeric id' })
  roleId!: string;

  @ApiProperty({ example: '3' })
  @IsString({ message: 'menuId must be a string' })
  @Matches(/^\d+$/, { message: 'menuId must be a numeric id' })
  menuId!: string;
}
