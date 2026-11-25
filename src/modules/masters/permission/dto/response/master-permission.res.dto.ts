import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { BaseAuditResponseDto } from '../../../shared/dto/response/base-audit.res.dto';
import { MasterPermissionScope } from '../../enum/master-permission.enums';

export class MasterPermissionResponseDto extends BaseAuditResponseDto {
  @ApiProperty({ example: 'ticket.create' })
  @IsString({ message: 'Code must be a string' })
  code!: string;

  @ApiProperty({ example: 'Create ticket' })
  @IsString({ message: 'Name must be a string' })
  name!: string;

  @ApiProperty({ example: 'ticket' })
  @IsString({ message: 'Category must be a string' })
  category!: string;

  @ApiProperty({
    enum: MasterPermissionScope,
    example: MasterPermissionScope.PROJECT,
  })
  @IsEnum(MasterPermissionScope, {
    message: 'Scope must be a valid master permission scope',
  })
  scope!: MasterPermissionScope;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description!: string | null;

  @ApiProperty({ example: 10 })
  @IsInt({ message: 'Sort order must be a whole number' })
  sortOrder!: number;

  @ApiProperty({ example: true })
  @IsBoolean({ message: 'isActive must be a boolean value' })
  isActive!: boolean;
}
