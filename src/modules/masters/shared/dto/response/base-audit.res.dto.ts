import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class BaseAuditResponseDto {
  @ApiProperty({ example: '1' })
  @IsString({ message: 'Id must be a string' })
  id!: string;

  @ApiProperty({ example: '2026-11-12T06:40:00.000Z' })
  @IsString({ message: 'Created at must be a string' })
  createdAt!: string;

  @ApiProperty({ example: '2026-11-12T06:40:00.000Z' })
  @IsString({ message: 'Updated at must be a string' })
  updatedAt!: string;
}
