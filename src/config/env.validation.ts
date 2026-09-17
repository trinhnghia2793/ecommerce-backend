import { z } from 'zod';

// declare
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(8080), // coerce --> force convert

  // database
  DB_HOST: z.string().trim().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535),
  DB_USERNAME: z.string().trim().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().trim().min(1),

  // database connection pool
  DB_POOL_MAX: z.coerce.number().default(10),
  DB_POOL_MIN: z.coerce.number().default(2),
  DB_POOL_CONNECTION_TIMEOUT_MS: z.coerce.number().default(5000),
  DB_POOL_IDLE_TIMEOUT_MS: z.coerce.number().default(30000),

  // // redis
  // REDIS_URL: z.string().optional(),
  // REDIS_HOST: z.string().optional(),
  // REDIS_POST: z.coerce.number().optional(),
  // REDIS_PASSWORD: z.string().optional(),

  // throttler
  THROTTLE_TTL_MS: z.coerce.number().default(1000),
  THROTTLE_LIMIT: z.coerce.number().default(60),

  // // auth
  // BETTER_AUTH_SECRET: z.string().min(1),
  // BETTER_AUTH_URL: z.string().url(),
  // BETTER_AUTH_SAMESITE_NONE: z.string().optional(),
  // BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional(),

  // // CORS
  // CLIENT_URL: z.string().optional(),
  // NEXT_PUBLIC_APP_URL: z.string().optional(),
  // LANDING_PAGE_URL: z.string().optional(),
  // ADMIN_PANEL_URL: z.string().optional(),
  // CORS_OTHER_ORIGINS: z.string().optional(),

  // email
  SMTP_USER: z.email(),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.email(),

  // // elastic search
  // ELASTICSEARCH_NODE: z.string().optional(),
  // ELASTICSEARCH_USERNAME: z.string().optional(),
  // ELASTICSEARCH_PASSWORD: z.string().optional(),

  // // supabase
  // SUPABASE_URL: z.string().url().optional(),
  // SUPABASE_ANON_KEY: z.string().optional(),
  // SUPABASE_BUCKET_NAME: z.string().optional(),

  // // payos
  // PAYOS_CLIENT_ID: z.string().optional(),
  // PAYOS_API_KEY: z.string().optional(),
  // PAYOS_CHECKSUM_KEY: z.string().optional(),
  // PAYOS_RETURN_URL: z.string().optional(),
  // PAYOS_CANCEL_URL: z.string().optional(),

  // // guest pool
  // GUEST_POOL_USER_ID: z.string().optional(),
});

// generate TypeScript Type based on envSchema
export type Env = z.infer<typeof envSchema>;

// check result
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => ` - ${i.path.join('.')} : ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  return parsed.data;
}
