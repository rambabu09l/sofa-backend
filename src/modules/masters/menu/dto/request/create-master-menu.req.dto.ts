import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { MasterMenuScope } from '../../enum/master-menu.enums';

export class CreateMasterMenuDto {
  @ApiPropertyOptional({
    example: '1',
    nullable: true,
    description: 'Parent menu id, or null for root',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString({ message: 'parentId must be a string' })
  @Matches(/^\d+$/, { message: 'parentId must be a numeric id' })
  parentId?: string | null;

  @ApiProperty({ example: 'tickets', maxLength: 80 })
  @IsString({ message: 'code must be a string' })
  @MinLength(1, { message: 'code is required' })
  @MaxLength(80, { message: 'code must be at most 80 characters' })
  code!: string;

  @ApiProperty({ example: 'Tickets', maxLength: 120 })
  @IsString({ message: 'name must be a string' })
  @MinLength(1, { message: 'name is required' })
  @MaxLength(120, { message: 'name must be at most 120 characters' })
  name!: string;

  @ApiPropertyOptional({ example: '/tickets', nullable: true, maxLength: 255 })
  @IsOptional()
  @IsString({ message: 'route must be a string' })
  @MaxLength(255, { message: 'route must be at most 255 characters' })
  route?: string | null;

  @ApiPropertyOptional({ example: 'ticket', nullable: true, maxLength: 80 })
  @IsOptional()
  @IsString({ message: 'icon must be a string' })
  @MaxLength(80, { message: 'icon must be at most 80 characters' })
  icon?: string | null;

  @ApiProperty({
    enum: MasterMenuScope,
    example: MasterMenuScope.PROJECT,
  })
  @IsEnum(MasterMenuScope, {
    message: 'scope must be SYSTEM, ORGANIZATION, or PROJECT',
  })
  scope!: MasterMenuScope;

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
