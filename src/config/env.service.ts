import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from './env.schema';

@Injectable()
export class EnvService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get<K extends keyof Env>(key: K): Env[K] {
    return this.config.get(key, { infer: true });
  }

  get isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  get isDevelopment(): boolean {
    return this.get('NODE_ENV') === 'development';
  }

  get corsOrigins(): string[] {
    return this.get('CORS_ORIGINS')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  get prettyLogs(): boolean {
    const explicit = this.get('LOG_PRETTY');
    return explicit ?? !this.isProduction;
  }

  /** Public browser origin (nginx / LB) — no trailing slash. */
  get publicAppOrigin(): string {
    return this.get('PUBLIC_APP_URL').replace(/\/+$/, '');
  }

  /**
   * Nest HTTP root for versioned API routes, e.g. `/api/v1`.
   * Must stay aligned with the SPA `VITE_API_BASE_URL`.
   */
  get apiRootPath(): string {
    const prefix = this.get('API_PREFIX').replace(/^\/+|\/+$/g, '');
    const version = String(this.get('API_VERSION')).replace(/^v/i, '');
    return `/${prefix}/v${version}`;
  }

  /** SuperTokens recipe base path (no trailing slash), e.g. `/auth`. */
  get superTokensApiBasePath(): string {
    return this.get('SUPERTOKENS_API_BASE_PATH').replace(/\/+$/, '') || '/auth';
  }

  /** Dashboard admin emails (write access). Empty = unrestricted among dashboard users. */
  get superTokensDashboardAdmins(): string[] {
    return this.get('SUPERTOKENS_DASHBOARD_ADMINS')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }

  /** True when Google OAuth client id + secret are both configured. */
  get isGoogleOAuthConfigured(): boolean {
    return (
      this.get('GOOGLE_OAUTH_CLIENT_ID').trim().length > 0 &&
      this.get('GOOGLE_OAUTH_CLIENT_SECRET').trim().length > 0
    );
  }
}
