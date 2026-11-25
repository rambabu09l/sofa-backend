import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';
import { ApiRateLimited } from './common/decorators/api-auth.decorator';
import { ApiOkEnvelope } from './common/decorators/api-envelope.decorator';
import { ApiMessage } from './common/decorators/api-message.decorator';
import { AppMetaResponseDto } from './common/dto/app-meta.res.dto';
import { AppService } from './app.service';

@ApiTags('meta')
@Public()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiMessage('API is healthy')
  @ApiOperation({
    summary: 'API metadata',
    description:
      'App name, environment and API version. No access token required. Use /health/live and /health/ready for probes.',
  })
  @ApiOkEnvelope(AppMetaResponseDto)
  @ApiRateLimited()
  getMeta() {
    return this.appService.getMeta();
  }
}
