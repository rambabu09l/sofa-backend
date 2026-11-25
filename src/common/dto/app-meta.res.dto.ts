import { ApiProperty } from '@nestjs/swagger';

export class AppMetaResponseDto {
  @ApiProperty({
    example: 'sofa-api',
    description: 'Service name from the APP_NAME setting.',
  })
  name: string;

  @ApiProperty({
    example: 'development',
    description: 'Runtime environment from NODE_ENV.',
  })
  env: string;

  @ApiProperty({
    example: '1',
    description: 'Public API version used in the /api/v{version} prefix.',
  })
  version: string;

  @ApiProperty({
    example: 'ok',
    description: 'Health indicator; always "ok" when the API responds.',
  })
  status: string;
}
