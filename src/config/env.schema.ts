import { z } from 'zod';

const booleanish = z.union([z.boolean(), z.string()]).transform((value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = value.toLowerCase().trim();
  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'off', ''].includes(normalized)) {
    return false;
  }

  throw new Error(`Invalid boolean value: ${value}`);
});

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  APP_NAME: z.string().min(1).default('sofa-api'),
  APP_HOST: z.string().min(1).default('0.0.0.0'),
  APP_PORT: z.coerce.number().int().positive().default(8083),
  API_PREFIX: z.string().min(1).default('api'),
  API_VERSION: z.string().min(1).default('1'),
  TRUST_PROXY: booleanish.default(false),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  LOG_PRETTY: booleanish.optional(),

  CORS_ORIGINS: z.string().min(1).default('http://localhost:5173'),
  CORS_CREDENTIALS: booleanish.default(true),
  BODY_LIMIT: z.string().min(1).default('1mb'),
  SWAGGER_ENABLED: booleanish.default(true),
  SWAGGER_PATH: z
    .string()
    .min(1)
    .default('docs')
    .transform((value) => value.replace(/^\/+|\/+$/g, '') || 'docs'),
  SWAGGER_BASIC_USER: z.string().optional().default(''),
  SWAGGER_BASIC_PASSWORD: z.string().optional().default(''),

  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),

  MYSQL_HOST: z.string().min(1),
  MYSQL_PORT: z.coerce.number().int().positive().default(3308),
  MYSQL_USER: z.string().min(1),
  MYSQL_PASSWORD: z.string().min(1),
  MYSQL_DATABASE: z.string().min(1),
  MYSQL_SYNC: booleanish.default(false),
  MYSQL_LOGGING: booleanish.default(false),
  MYSQL_POOL_SIZE: z.coerce.number().int().positive().default(10),
  MYSQL_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  MYSQL_SSL: booleanish.default(false),
  MYSQL_SSL_REJECT_UNAUTHORIZED: booleanish.default(false),

  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().positive().default(6382),
  REDIS_PASSWORD: z.string().optional().default(''),
  REDIS_DB: z.coerce.number().int().min(0).default(0),
  REDIS_KEY_PREFIX: z.string().default('sofa:'),
  REDIS_TLS: booleanish.default(false),

  /**
   * Public browser origin (nginx edge). Single source of truth for invite email links
   * and post-logout redirects.
   * Do not set a separate FRONTEND_URL — if present in the environment it must match this value.
   */
  PUBLIC_APP_URL: z.string().url().default('http://localhost:8089'),

  /**
   * SuperTokens Core (self-hosted). Nest is the only caller — never expose Core to browsers.
   * @see https://supertokens.com/docs/deployment/self-host-supertokens
   */
  SUPERTOKENS_CONNECTION_URI: z.string().url(),
  /** Shared with Core `API_KEYS`. Generate with `openssl rand -hex 32`. */
  SUPERTOKENS_API_KEY: z.string().min(32),
  /**
   * Domain the browser uses to reach Nest (same-origin via nginx = PUBLIC_APP_URL).
   * Must match frontend `VITE_SUPERTOKENS_API_DOMAIN`.
   */
  SUPERTOKENS_API_DOMAIN: z.string().url(),
  /**
   * SuperTokens recipe API path. Default `/auth` (official). Must match frontend
   * `VITE_SUPERTOKENS_API_BASE_PATH` and be proxied by nginx.
   */
  SUPERTOKENS_API_BASE_PATH: z
    .string()
    .min(1)
    .regex(/^\//, 'Must start with /')
    .default('/auth'),
  /** Display name in SuperTokens emails; keep aligned with the SPA app name. */
  SUPERTOKENS_APP_NAME: z.string().min(1).default('Sofa'),
  /**
   * Comma-separated dashboard admin emails (write access).
   * Empty = all dashboard users can read/write. Set in prod to lock down writes.
   * @see https://supertokens.com/docs/post-authentication/dashboard/initial-setup
   */
  SUPERTOKENS_DASHBOARD_ADMINS: z.string().optional().default(''),

  /**
   * Google OAuth (SuperTokens ThirdParty). Both must be set to enable the provider.
   * Create credentials in Google Cloud Console → APIs & Services → Credentials (OAuth 2.0 Client).
   * Authorized redirect URI on Google: `{PUBLIC_APP_URL}/login/callback/google`
   * (SPA path — `/auth/*` is reserved for Nest SuperTokens APIs behind nginx.)
   * @see https://supertokens.com/docs/authentication/social/initial-setup
   */
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional().default(''),

  EMAIL_PRIMARY_PROVIDER: z.enum(['gmail', 'resend']).default('gmail'),
  EMAIL_FALLBACK_PROVIDER: z.enum(['gmail', 'resend']).default('resend'),
  EMAIL_FROM_ADDRESS: z.string().email().optional().default('noreply@sofa.local'),
  EMAIL_FROM_NAME: z.string().min(1).default('Sofa'),

  SMTP_HOST: z.string().min(1).default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_SECURE: booleanish.default(true),
  SMTP_USERNAME: z.string().optional().default(''),
  SMTP_PASSWORD: z.string().optional().default(''),
  SMTP_APP_PASSWORD: z.string().optional().default(''),

  RESEND_API_KEY: z.string().optional().default(''),

  /** ClamAV clamd — fail closed when enabled. */
  CLAMAV_ENABLED: booleanish.default(true),
  CLAMAV_HOST: z.string().min(1).default('127.0.0.1'),
  CLAMAV_PORT: z.coerce.number().int().positive().default(3311),
  CLAMAV_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),

  /** S3-compatible object storage (MinIO). */
  S3_ENDPOINT: z.string().url().default('http://127.0.0.1:9010'),
  S3_REGION: z.string().min(1).default('us-east-1'),
  S3_ACCESS_KEY: z.string().min(1).default('minioadmin'),
  S3_SECRET_KEY: z.string().min(1).default('minioadmin'),
  S3_BUCKET: z.string().min(1).default('sofa-documents'),
  S3_FORCE_PATH_STYLE: booleanish.default(true),
  S3_PRESIGN_PUT_EXPIRES_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(900),
  S3_PRESIGN_GET_EXPIRES_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(300),

  DOCUMENT_MAX_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(52_428_800),
  DOCUMENT_SCAN_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),

  /** Kafka — async document malware scan. */
  KAFKA_BROKERS: z.string().min(1).default('127.0.0.1:9094'),
  KAFKA_CLIENT_ID: z.string().min(1).default('sofa-api'),
  KAFKA_SSL: booleanish.default(false),
  KAFKA_DOCUMENT_SCAN_TOPIC: z
    .string()
    .min(1)
    .default('sofa.document.scan'),
  KAFKA_DOCUMENT_SCAN_GROUP_ID: z
    .string()
    .min(1)
    .default('sofa-document-scan'),

  /**
   * Third-party integrations (Jira / Linear / GitHub / Asana). Credentials stay server-side.
   * Leave CLIENT_* empty until OAuth / GitHub Apps are configured.
   */
  JIRA_INTEGRATION_ENABLED: booleanish.default(false),
  JIRA_CLIENT_ID: z.string().optional().default(''),
  JIRA_CLIENT_SECRET: z.string().optional().default(''),
  JIRA_CALLBACK_URL: z
    .string()
    .url()
    .default(
      'http://localhost:8089/api/v1/integrations/jira/callback',
    ),
  LINEAR_INTEGRATION_ENABLED: booleanish.default(false),
  LINEAR_CLIENT_ID: z.string().optional().default(''),
  LINEAR_CLIENT_SECRET: z.string().optional().default(''),
  LINEAR_CALLBACK_URL: z
    .string()
    .url()
    .default(
      'http://localhost:8089/api/v1/integrations/linear/callback',
    ),
  GITHUB_INTEGRATION_ENABLED: booleanish.default(false),
  /** Numeric GitHub App ID (JWT / installation tokens). */
  GITHUB_APP_ID: z.string().optional().default(''),
  /**
   * App slug from the GitHub App settings URL (`github.com/apps/{slug}`).
   * When set, connect uses the install URL so install + user OAuth happen together.
   */
  GITHUB_APP_SLUG: z.string().optional().default(''),
  GITHUB_CLIENT_ID: z.string().optional().default(''),
  GITHUB_CLIENT_SECRET: z.string().optional().default(''),
  /**
   * GitHub App private key PEM. Prefer a single line with literal \n escapes,
   * or a multiline secret in the host environment.
   */
  GITHUB_PRIVATE_KEY: z.string().optional().default(''),
  GITHUB_CALLBACK_URL: z
    .string()
    .url()
    .default(
      'http://localhost:8089/api/v1/integrations/github/callback',
    ),
  ASANA_INTEGRATION_ENABLED: booleanish.default(false),
  ASANA_CLIENT_ID: z.string().optional().default(''),
  ASANA_CLIENT_SECRET: z.string().optional().default(''),
  ASANA_CALLBACK_URL: z
    .string()
    .url()
    .default(
      'http://localhost:8089/api/v1/integrations/asana/callback',
    ),
  /** AES-GCM key material for encrypting provider tokens at rest (min 32 chars). */
  INTEGRATION_CREDENTIALS_SECRET: z
    .string()
    .min(32)
    .default('dev-only-change-me-integration-credentials!!'),
});

export type Env = z.infer<typeof envSchema>;
