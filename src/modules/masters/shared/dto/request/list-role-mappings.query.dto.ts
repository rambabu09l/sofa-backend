import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class ListRoleMappingsQueryDto {
  @ApiPropertyOptional({
    example: '1',
    description: 'When set, only mappings for this role id',
  })
  @IsOptional()
  @IsString({ message: 'roleId must be a string' })
  @Matches(/^\d+$/, { message: 'roleId must be a numeric id' })
  roleId?: string;
}
