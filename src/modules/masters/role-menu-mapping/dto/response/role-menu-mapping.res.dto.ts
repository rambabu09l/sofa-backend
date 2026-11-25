import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RoleMenuMappingResponseDto {
  @ApiProperty({ example: '1' })
  @IsString({ message: 'Role id must be a string' })
  roleId!: string;

  @ApiProperty({ example: '3' })
  @IsString({ message: 'Menu id must be a string' })
  menuId!: string;
}
