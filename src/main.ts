import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';
import { EnvService } from './config/env.service';
import { isSwaggerEnabled, swaggerDocsPath } from './config/swagger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  const env = app.get(EnvService);

  app.useLogger(logger);
  configureApp(app, env);

  const host = env.get('APP_HOST');
  const port = env.get('APP_PORT');
  await app.listen(port, host);

  logger.log(
    `${env.get('APP_NAME')} listening on ${host}:${port} [${env.get('NODE_ENV')}]`,
  );

  if (isSwaggerEnabled(env)) {
    const publicHost = ['0.0.0.0', '::'].includes(host) ? 'localhost' : host;
    const docsUrl = `http://${publicHost}:${port}/${swaggerDocsPath(env)}`;
    logger.log(
      `Swagger UI: ${docsUrl} (OpenAPI JSON: ${docsUrl}-json, YAML: ${docsUrl}-yaml)`,
    );
  }
}

void bootstrap();
