import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { BaseAuditResponseDto } from '../../../shared/dto/response/base-audit.res.dto';
import { MasterRoleScope } from '../../enum/master-role.enums';

export class MasterRoleResponseDto extends BaseAuditResponseDto {
  @ApiProperty({ example: 'OWNER' })
  @IsString({ message: 'Code must be a string' })
  code!: string;

  @ApiProperty({ example: 'Owner' })
  @IsString({ message: 'Name must be a string' })
  name!: string;

  @ApiProperty({ enum: MasterRoleScope, example: MasterRoleScope.ORGANIZATION })
  @IsEnum(MasterRoleScope, {
    message: 'Scope must be a valid master role scope',
  })
  scope!: MasterRoleScope;

  @ApiPropertyOptional({ example: 'Full organization control', nullable: true })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description!: string | null;

  @ApiProperty({ example: true })
  @IsBoolean({ message: 'isSystem must be a boolean value' })
  isSystem!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean({ message: 'isAssignable must be a boolean value' })
  isAssignable!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean({ message: 'isActive must be a boolean value' })
  isActive!: boolean;
}
