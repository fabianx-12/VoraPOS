import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_PATH: z.string().default('vorapos.db'),
  TERMINAL_CODE: z.string().default('POS-01'),
  CLOUD_SYNC_URL: z.string().url().default('https://api.vorapos.com/v1/sync'),
  CLOUD_SYNC_API_KEY: z.string().default('local_dev_api_key'),
  SYNC_INTERVAL_MS: z.coerce.number().int().positive().default(15000),
  SYNC_BATCH_SIZE: z.coerce.number().int().positive().default(50),
  SERVER_PORT: z.coerce.number().int().positive().default(3000),
  PRINTER_INTERFACE: z.enum(['usb', 'serial', 'network', 'mock']).default('mock'),
  PRINTER_ADDRESS: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function loadEnvConfig(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment configuration:', result.error.format());
    throw new Error('Environment configuration validation failed');
  }
  return result.data;
}

export const config = loadEnvConfig();
