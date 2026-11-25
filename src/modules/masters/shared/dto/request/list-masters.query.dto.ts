import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ListMastersQueryDto {
  @ApiPropertyOptional({
    example: false,
    description: 'When true, include inactive rows',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return false;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    const normalized = String(value).toLowerCase().trim();
    return ['true', '1', 'yes', 'on'].includes(normalized);
  })
  @IsBoolean({ message: 'includeInactive must be a boolean' })
  includeInactive?: boolean = false;
}
