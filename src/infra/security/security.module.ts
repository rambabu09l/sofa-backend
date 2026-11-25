import { Global, Module } from '@nestjs/common';
import { ClamAvModule } from './clamAv/clamav.module';

@Global()
@Module({
  imports: [ClamAvModule],
  exports: [ClamAvModule],
})
export class SecurityModule {}
