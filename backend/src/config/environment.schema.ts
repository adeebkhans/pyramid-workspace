import { z } from 'zod';

/**
 * Every environment variable the API understands, described once.
 *
 * The schema is the single source of truth: it coerces raw strings into real
 * types, applies defaults, and fails the process at boot rather than letting a
 * mis-typed connection string surface as a runtime 500 an hour later.
 */
const booleanFromEnv = z
  .union([z.boolean(), z.string()])
  .transform((value) =>
    typeof value === 'boolean' ? value : ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase()),
  );

const csvList = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  );

export const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  API_GLOBAL_PREFIX: z.string().min(1).default('api'),
  LOG_LEVEL: z.enum(['error', 'warn', 'log', 'debug', 'verbose']).default('log'),

  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required — point it at a local mongod or an Atlas cluster')
    .refine(
      (value) => value.startsWith('mongodb://') || value.startsWith('mongodb+srv://'),
      'MONGODB_URI must start with mongodb:// or mongodb+srv://',
    ),
  MONGODB_MAX_POOL_SIZE: z.coerce.number().int().min(1).max(500).default(10),

  CORS_ALLOWED_ORIGINS: csvList.default('http://localhost:3000'),
  RATE_LIMIT_TTL_SECONDS: z.coerce.number().int().min(1).default(60),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(1).default(300),

  SWAGGER_ENABLED: booleanFromEnv.default(true),
  SEED_ON_BOOT: booleanFromEnv.default(true),
});

export type Environment = z.infer<typeof environmentSchema>;

/**
 * Hooked into `ConfigModule.forRoot({ validate })`. Nest calls this with the
 * raw `process.env` bag before any provider is instantiated.
 */
export function validateEnvironment(raw: Record<string, unknown>): Environment {
  const outcome = environmentSchema.safeParse(raw);

  if (!outcome.success) {
    const report = outcome.error.issues
      .map((issue) => `  • ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');

    throw new Error(`Invalid environment configuration:\n${report}\n`);
  }

  return outcome.data;
}
