import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CompleteSocialSignupDto {
  @ApiPropertyOptional({ example: 'Ada', maxLength: 180 })
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MaxLength(180, { message: 'First name must not exceed 180 characters' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Lovelace', maxLength: 180 })
  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(180, { message: 'Last name must not exceed 180 characters' })
  lastName?: string;
}