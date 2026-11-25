import { timingSafeEqual } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import { SWAGGER_BEARER_AUTH } from '../common/constants/swagger';
import {
  ApiErrorDto,
  ApiErrorEnvelopeDto,
  ApiMetadataDto,
  ApiSuccessEnvelopeDto,
  PaginationMetaDto,
} from '../common/dto/api-envelope.dto';
import { EnvService } from './env.service';

const DESCRIPTION = `
Sofa HTTP API.

## Auth
Authentication is SuperTokens (EmailPassword + Session).
- SPA: httpOnly SuperTokens session cookies via \`/auth/*\` (same origin).
- Extension: SuperTokens header transfer (\`st-auth-mode: header\`).
Protected Nest routes require a valid SuperTokens session; \`GET /api/v1/auth/me\` returns the Sofa profile.

## Envelope
Every JSON business response uses the same shape. Health probes stay raw.

## Versioning
Business routes live under \`/{API_PREFIX}/v{API_VERSION}\` (default \`/api/v1\`).
Liveness and readiness stay unversioned at \`/health/live\` and \`/health/ready\`.
SuperTokens recipe APIs stay at \`/auth/*\` (not under the API prefix).
`.trim();

export function isSwaggerEnabled(env: EnvService): boolean {
  if (!env.get('SWAGGER_ENABLED')) {
    return false;
  }

  if (!env.isProduction) {
    return true;
  }

  return hasSwaggerBasicAuth(env);
}

export function hasSwaggerBasicAuth(env: EnvService): boolean {
  const user = env.get('SWAGGER_BASIC_USER') ?? '';
  const password = env.get('SWAGGER_BASIC_PASSWORD') ?? '';
  return user.length > 0 && password.length > 0;
}

/** Helmet options safe for local HTTP BFF (nginx :8089). */
export function appHelmetOptions(env: EnvService) {
  const isProd = env.get('NODE_ENV') === 'production';

  return {
    // HSTS on http://localhost poisons the browser into https://localhost:8089 (no TLS) → hung loads.
    hsts: isProd,
    crossOriginEmbedderPolicy: false as const,
    crossOriginOpenerPolicy: false as const,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // SuperTokens dashboard (jsDelivr) + Swagger.
        // @see https://supertokens.com/docs/post-authentication/dashboard/initial-setup
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        imgSrc: [
          "'self'",
          'data:',
          'validator.swagger.io',
          'https://cdn.jsdelivr.net',
          'https://purecatamphetamine.github.io',
        ],
        fontSrc: ["'self'", 'https:', 'data:', 'https://cdn.jsdelivr.net'],
        // Dashboard API calls hit Nest `/auth/dashboard/*` (same origin).
        connectSrc: ["'self'"],
        ...(isProd ? {} : { upgradeInsecureRequests: null }),
      },
    },
  };
}

/** @deprecated Use appHelmetOptions — kept name for existing imports. */
export function swaggerHelmetOptions(env: EnvService) {
  return appHelmetOptions(env);
}

export function swaggerDocsPath(env: EnvService): string {
  return env.get('SWAGGER_PATH').replace(/^\/+|\/+$/g, '') || 'docs';
}

export function setupSwagger(app: INestApplication, env: EnvService): void {
  const docsPath = swaggerDocsPath(env);
  const port = env.get('APP_PORT');

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Sofa API')
      .setDescription(DESCRIPTION)
      .setVersion(env.get('API_VERSION'))
      .addServer(`http://localhost:${port}`, 'Local development')
      .addServer('/', 'Current host')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
          description:
            'SuperTokens access token (header transfer / extension). SPA uses cookies.',
        },
        SWAGGER_BEARER_AUTH,
      )
      .addGlobalParameters({
        name: 'X-Request-Id',
        in: 'header',
        required: false,
        description: 'Optional correlation id; generated if omitted',
        schema: { type: 'string', format: 'uuid' },
      })
      .addTag('meta', 'API metadata')
      .build(),
    {
      extraModels: [
        ApiSuccessEnvelopeDto,
        ApiErrorEnvelopeDto,
        ApiErrorDto,
        ApiMetadataDto,
        PaginationMetaDto,
      ],
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        `${controllerKey.replace(/Controller$/, '')}_${methodKey}`,
      deepScanRoutes: true,
    },
  );

  if (hasSwaggerBasicAuth(env)) {
    const protect = swaggerBasicAuth(
      env.get('SWAGGER_BASIC_USER'),
      env.get('SWAGGER_BASIC_PASSWORD'),
    );
    app.use(
      [`/${docsPath}`, `/${docsPath}-json`, `/${docsPath}-yaml`],
      protect,
    );
  }

  SwaggerModule.setup(docsPath, app, document, {
    customSiteTitle: 'Sofa API',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
    },
    jsonDocumentUrl: `${docsPath}-json`,
    yamlDocumentUrl: `${docsPath}-yaml`,
  });
}

function swaggerBasicAuth(user: string, password: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Basic ')) {
      challenge(res);
      return;
    }

    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const separator = decoded.indexOf(':');
    const givenUser = separator >= 0 ? decoded.slice(0, separator) : decoded;
    const givenPassword = separator >= 0 ? decoded.slice(separator + 1) : '';

    if (!safeEqual(givenUser, user) || !safeEqual(givenPassword, password)) {
      challenge(res);
      return;
    }

    next();
  };
}

function challenge(res: Response): void {
  res.setHeader('WWW-Authenticate', 'Basic realm="Swagger docs"');
  res.status(401).send('Authentication required');
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
