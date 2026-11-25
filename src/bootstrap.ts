import {
  HttpException,
  HttpStatus,
  INestApplication,
  RequestMethod,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import supertokens from 'supertokens-node';
import { middleware as superTokensMiddleware } from 'supertokens-node/framework/express';
import { SuperTokensExceptionFilter } from 'supertokens-nestjs';
import { EnvService } from './config/env.service';
import {
  appHelmetOptions,
  isSwaggerEnabled,
  setupSwagger,
} from './config/swagger';
import { ErrorCode, HttpUserMessage } from './common/http/http-messages';
import { flattenValidationErrors } from './common/http/validation-errors';

export function configureApp(app: INestApplication, env: EnvService): void {
  const expressApp = app as NestExpressApplication;

  expressApp.set('trust proxy', env.get('TRUST_PROXY'));
  expressApp.useBodyParser('json', { limit: env.get('BODY_LIMIT') });
  expressApp.useBodyParser('urlencoded', {
    limit: env.get('BODY_LIMIT'),
    extended: true,
  });
  app.use(cookieParser());

  app.enableShutdownHooks();
  // Always use appHelmetOptions: default helmet enables HSTS + upgrade-insecure-requests,
  // which breaks local HTTP (nginx :8089) and can hang the SPA forever.
  app.use(helmet(appHelmetOptions(env)));
  app.use(compression());
  // SuperTokens requires its CORS headers + credentials (official Nest guide).
  app.enableCors({
    origin: env.corsOrigins,
    allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
    credentials: env.get('CORS_CREDENTIALS'),
  });

  // Mount SuperTokens on the Express app (handles `/auth/*` including dashboard).
  // Nest `forRoutes('*')` middleware is unreliable on Nest 11 for these paths.
  // @see https://supertokens.com/docs/quickstart/backend-setup
  app.use(superTokensMiddleware());

  // Do not exclude `auth` from the API prefix — Nest `@Controller('auth')` must stay
  // at `/api/v1/auth/*`. SuperTokens owns root `/auth/*` via the Express middleware above.
  app.setGlobalPrefix(env.get('API_PREFIX'), {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'health/live', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
    ],
  });

  // Official Nest integration: handle SuperTokens SDK errors for the frontend.
  app.useGlobalFilters(new SuperTokensExceptionFilter());

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: env.get('API_VERSION'),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const details = flattenValidationErrors(errors);
        return new HttpException(
          {
            message: details[0]?.message ?? HttpUserMessage.VALIDATION,
            code: ErrorCode.VALIDATION_ERROR,
            details,
          },
          HttpStatus.BAD_REQUEST,
        );
      },
    }),
  );

  if (isSwaggerEnabled(env)) {
    setupSwagger(app, env);
  }
}
