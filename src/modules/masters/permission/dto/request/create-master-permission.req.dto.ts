import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateMasterPermissionDto {
  @ApiProperty({ example: 'ticket.create', maxLength: 100 })
  @IsString({ message: 'code must be a string' })
  @MinLength(1, { message: 'code is required' })
  @MaxLength(100, { message: 'code must be at most 100 characters' })
  code!: string;

  @ApiProperty({ example: 'Create ticket', maxLength: 150 })
  @IsString({ message: 'name must be a string' })
  @MinLength(1, { message: 'name is required' })
  @MaxLength(150, { message: 'name must be at most 150 characters' })
  name!: string;

  @ApiProperty({ example: 'ticket', maxLength: 64 })
  @IsString({ message: 'category must be a string' })
  @MinLength(1, { message: 'category is required' })
  @MaxLength(64, { message: 'category must be at most 64 characters' })
  category!: string;

  @ApiProperty({
    enum: MasterPermissionScope,
    example: MasterPermissionScope.PROJECT,
  })
  @IsEnum(MasterPermissionScope, {
    message: 'scope must be SYSTEM, ORGANIZATION, or PROJECT',
  })
  scope!: MasterPermissionScope;

  @ApiPropertyOptional({ maxLength: 500, nullable: true })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @MaxLength(500, { message: 'description must be at most 500 characters' })
  description?: string | null;

  @ApiPropertyOptional({ example: 10, default: 0 })
  @IsOptional()
  @IsInt({ message: 'sortOrder must be a whole number' })
  @Min(0, { message: 'sortOrder cannot be negative' })
  sortOrder?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;
}
