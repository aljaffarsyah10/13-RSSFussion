import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  REDIS_URL: z.string().url().optional(),
  CACHE_DRIVER: z.enum(["redis", "memory"]).default("memory"),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  BACKUP_RETENTION_COUNT: z.coerce.number().int().min(1).default(7),
  PORT: z.coerce.number().int().default(3000),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): { valid: boolean; errors?: string[]; config: EnvConfig } {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorMessages = result.error.issues.map(
      (e) => `${e.path.join(".")}: ${e.message}`
    );
    return {
      valid: false,
      errors: errorMessages,
      config: process.env as unknown as EnvConfig,
    };
  }

  // Production-specific warnings
  if (result.data.NODE_ENV === "production") {
    const missingKeys: string[] = [];
    if (!result.data.NEXT_PUBLIC_SUPABASE_URL) missingKeys.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!result.data.NEXT_PUBLIC_SUPABASE_ANON_KEY) missingKeys.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    if (!result.data.SUPABASE_SERVICE_ROLE_KEY) missingKeys.push("SUPABASE_SERVICE_ROLE_KEY");

    if (missingKeys.length > 0) {
      return {
        valid: false,
        errors: [`Production requires mandatory database keys: ${missingKeys.join(", ")}`],
        config: result.data,
      };
    }
  }

  return {
    valid: true,
    config: result.data,
  };
}

export const env = envSchema.parse(process.env);
