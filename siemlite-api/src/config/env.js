const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('24h'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  COOKIE_SECURE: z
    .string()
    .optional()
    .default('false')
    .transform((v) => v === 'true'),
});

let cachedEnv = null;

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment configuration:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}

function getEnv() {
  if (!cachedEnv) {
    return validateEnv();
  }
  return cachedEnv;
}

module.exports = { validateEnv, getEnv };
