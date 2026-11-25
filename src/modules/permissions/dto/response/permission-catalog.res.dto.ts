import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class PermissionCatalogResponseDto {
  @ApiProperty({ example: 'PROJECT_VIEW' })
  @IsString({ message: 'Code must be a string' })
  code!: string;

  @ApiProperty({
    example: 'PROJECT',
    description: 'ORG for organization-scope rows; PROJECT for project-scope',
  })
  @IsString({ message: 'Scope must be a string' })
  scope!: 'ORG' | 'PROJECT' | 'SYSTEM';

  @ApiProperty({ example: 'PROJECT' })
  @IsString({ message: 'Category must be a string' })
  category!: string;

  @ApiProperty({ example: 'View project' })
  @IsString({ message: 'Name must be a string' })
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description!: string | null;

  @ApiProperty({ example: 10 })
  @IsInt({ message: 'Sort order must be a whole number' })
  sortOrder!: number;
}
