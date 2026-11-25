import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MasterPermissionScope } from '../../enum/master-permission.enums';

export class UpdateMasterPermissionDto {
  @ApiPropertyOptional({ example: 'ticket.create', maxLength: 100 })
  @IsOptional()
  @IsString({ message: 'code must be a string' })
  @MinLength(1, { message: 'code cannot be empty' })
  @MaxLength(100, { message: 'code must be at most 100 characters' })
  code?: string;

  @ApiPropertyOptional({ example: 'Create ticket', maxLength: 150 })
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @MinLength(1, { message: 'name cannot be empty' })
  @MaxLength(150, { message: 'name must be at most 150 characters' })
  name?: string;

  @ApiPropertyOptional({ example: 'ticket', maxLength: 64 })
  @IsOptional()
  @IsString({ message: 'category must be a string' })
  @MinLength(1, { message: 'category cannot be empty' })
  @MaxLength(64, { message: 'category must be at most 64 characters' })
  category?: string;

  @ApiPropertyOptional({ enum: MasterPermissionScope })
  @IsOptional()
  @IsEnum(MasterPermissionScope, {
    message: 'scope must be SYSTEM, ORGANIZATION, or PROJECT',
  })
  scope?: MasterPermissionScope;

  @ApiPropertyOptional({ maxLength: 500, nullable: true })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @MaxLength(500, { message: 'description must be at most 500 characters' })
  description?: string | null;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt({ message: 'sortOrder must be a whole number' })
  @Min(0, { message: 'sortOrder cannot be negative' })
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;
}
