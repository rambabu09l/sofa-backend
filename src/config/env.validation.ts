import { envSchema, type Env } from './env.schema';

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');

    throw new Error(`Invalid environment variables:\n${details}`);
  }

  const publicOrigin = stripTrailingSlash(parsed.data.PUBLIC_APP_URL);
  const legacyFrontend = config.FRONTEND_URL;
  if (typeof legacyFrontend === 'string' && legacyFrontend.trim().length > 0) {
    const frontendOrigin = stripTrailingSlash(legacyFrontend.trim());
    if (frontendOrigin !== publicOrigin) {
      throw new Error(
        `FRONTEND_URL (${frontendOrigin}) must match PUBLIC_APP_URL (${publicOrigin}). ` +
          'Omit FRONTEND_URL and use PUBLIC_APP_URL as the single browser origin.',
      );
    }
  }

  return parsed.data;
}
