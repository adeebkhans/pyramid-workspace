import { registerAs } from '@nestjs/config';

import type { Environment } from './environment.schema';

/**
 * Config is exposed as three small, strongly-typed namespaces rather than as
 * loose `configService.get('SOME_KEY')` string lookups. Consumers inject
 * exactly the slice they need, which keeps modules honest about what they
 * actually depend on and makes a missing setting a compile error.
 */

export interface RuntimeSettings {
  environment: Environment['NODE_ENV'];
  port: number;
  globalPrefix: string;
  logLevel: Environment['LOG_LEVEL'];
  swaggerEnabled: boolean;
  seedOnBoot: boolean;
  isProduction: boolean;
}

export interface PersistenceSettings {
  uri: string;
  maxPoolSize: number;
}

export interface SecuritySettings {
  allowedOrigins: string[];
  rateLimit: {
    ttlSeconds: number;
    maxRequests: number;
  };
}

const env = () => process.env as unknown as Environment;

export const runtimeSettings = registerAs('runtime', (): RuntimeSettings => {
  const source = env();
  return {
    environment: source.NODE_ENV,
    port: Number(source.API_PORT),
    globalPrefix: source.API_GLOBAL_PREFIX,
    logLevel: source.LOG_LEVEL,
    swaggerEnabled: String(source.SWAGGER_ENABLED) === 'true',
    seedOnBoot: String(source.SEED_ON_BOOT) === 'true',
    isProduction: source.NODE_ENV === 'production',
  };
});

export const persistenceSettings = registerAs('persistence', (): PersistenceSettings => {
  const source = env();
  return {
    uri: source.MONGODB_URI,
    maxPoolSize: Number(source.MONGODB_MAX_POOL_SIZE),
  };
});

export const securitySettings = registerAs('security', (): SecuritySettings => {
  const source = env();
  const origins = String(source.CORS_ALLOWED_ORIGINS)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  return {
    allowedOrigins: origins,
    rateLimit: {
      ttlSeconds: Number(source.RATE_LIMIT_TTL_SECONDS),
      maxRequests: Number(source.RATE_LIMIT_MAX_REQUESTS),
    },
  };
});

export const configNamespaces = [runtimeSettings, persistenceSettings, securitySettings];
