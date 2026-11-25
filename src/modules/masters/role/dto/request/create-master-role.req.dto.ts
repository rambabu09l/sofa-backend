import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MasterRoleScope } from '../../enum/master-role.enums';

export class CreateMasterRoleDto {
  @ApiProperty({ example: 'AUDITOR', maxLength: 64 })
  @IsString({ message: 'code must be a string' })
  @MinLength(1, { message: 'code is required' })
  @MaxLength(64, { message: 'code must be at most 64 characters' })
  code!: string;

  @ApiProperty({ example: 'Auditor', maxLength: 100 })
  @IsString({ message: 'name must be a string' })
  @MinLength(1, { message: 'name is required' })
  @MaxLength(100, { message: 'name must be at most 100 characters' })
  name!: string;

  @ApiProperty({ enum: MasterRoleScope, example: MasterRoleScope.ORGANIZATION })
  @IsEnum(MasterRoleScope, {
    message: 'scope must be SYSTEM or ORGANIZATION',
  })
  scope!: MasterRoleScope;

  @ApiPropertyOptional({ maxLength: 500, nullable: true })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @MaxLength(500, { message: 'description must be at most 500 characters' })
  description?: string | null;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean({ message: 'isSystem must be a boolean' })
  isSystem?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean({ message: 'isAssignable must be a boolean' })
  isAssignable?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;
}
