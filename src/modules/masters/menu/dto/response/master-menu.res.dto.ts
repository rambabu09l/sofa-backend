import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { BaseAuditResponseDto } from '../../../shared/dto/response/base-audit.res.dto';
import { MasterMenuScope } from '../../enum/master-menu.enums';

export class MasterMenuResponseDto extends BaseAuditResponseDto {
  @ApiPropertyOptional({ example: null, nullable: true })
  @IsOptional()
  @IsString({ message: 'Parent id must be a string' })
  parentId!: string | null;

  @ApiProperty({ example: 'tickets' })
  @IsString({ message: 'Code must be a string' })
  code!: string;

  @ApiProperty({ example: 'Tickets' })
  @IsString({ message: 'Name must be a string' })
  name!: string;

  @ApiPropertyOptional({ example: '/tickets', nullable: true })
  @IsOptional()
  @IsString({ message: 'Route must be a string' })
  route!: string | null;

  @ApiPropertyOptional({ example: 'ticket', nullable: true })
  @IsOptional()
  @IsString({ message: 'Icon must be a string' })
  icon!: string | null;

  @ApiProperty({
    enum: MasterMenuScope,
    example: MasterMenuScope.PROJECT,
  })
  @IsEnum(MasterMenuScope, {
    message: 'Scope must be a valid master menu scope',
  })
  scope!: MasterMenuScope;

  @ApiProperty({ example: 10 })
  @IsInt({ message: 'Sort order must be a whole number' })
  sortOrder!: number;

  @ApiProperty({ example: true })
  @IsBoolean({ message: 'isActive must be a boolean value' })
  isActive!: boolean;
}
