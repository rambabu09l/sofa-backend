import { validateEnv } from './env.validation';

const base = {
  MYSQL_HOST: '127.0.0.1',
  MYSQL_USER: 'sofa',
  MYSQL_PASSWORD: 'secret',
  MYSQL_DATABASE: 'sofa',
  REDIS_HOST: '127.0.0.1',
  PUBLIC_APP_URL: 'http://localhost:8089',
  SUPERTOKENS_CONNECTION_URI: 'http://127.0.0.1:3568',
  SUPERTOKENS_API_KEY: 'dev-only-change-me-supertokens-api-key-32chars',
  SUPERTOKENS_API_DOMAIN: 'http://localhost:8089',
};

describe('validateEnv', () => {
  it('accepts PUBLIC_APP_URL alone', () => {
    const env = validateEnv({ ...base });
    expect(env.PUBLIC_APP_URL).toBe('http://localhost:8089');
    expect(env.SUPERTOKENS_API_BASE_PATH).toBe('/auth');
    expect(env.SUPERTOKENS_APP_NAME).toBe('Sofa');
  });

  it('allows legacy FRONTEND_URL when it matches PUBLIC_APP_URL', () => {
    expect(() =>
      validateEnv({
        ...base,
        FRONTEND_URL: 'http://localhost:8089/',
      }),
    ).not.toThrow();
  });

  it('rejects FRONTEND_URL that differs from PUBLIC_APP_URL', () => {
    expect(() =>
      validateEnv({
        ...base,
        FRONTEND_URL: 'http://localhost:5173',
      }),
    ).toThrow(/FRONTEND_URL/);
  });
});
