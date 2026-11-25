import { Injectable } from '@nestjs/common';
import { EnvService } from './config/env.service';

@Injectable()
export class AppService {
  constructor(private readonly env: EnvService) {}

  getMeta() {
    return {
      name: this.env.get('APP_NAME'),
      env: this.env.get('NODE_ENV'),
      version: this.env.get('API_VERSION'),
      status: 'ok',
    };
  }
}
