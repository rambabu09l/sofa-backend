import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SocialProvisioningStatusDto {
  @ApiProperty({
    enum: ['ready', 'needs_provisioning'],
    description:
      'ready = Sofa user exists; needs_provisioning = SuperTokens session only (finish Google signup)',
  })
  status!: 'ready' | 'needs_provisioning';

  @ApiPropertyOptional({ example: 'ada@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: 'Ada' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Lovelace' })
  lastName?: string;
}
