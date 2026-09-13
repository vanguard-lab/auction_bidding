/**
 * Application configuration.
 * Reads from environment variables with sensible defaults.
 */
export interface AppConfig {
  port: number;
  dbHost: string;
  dbPort: number;
  dbUser: string;
  dbPassword: string;
  dbName: string;
  jwtSecret: string;
  jwtExpiresIn: string;
}

export function loadConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT ?? '3000', 10),
    dbHost: process.env.DB_HOST ?? 'localhost',
    dbPort: parseInt(process.env.DB_PORT ?? '5432', 10),
    dbUser: process.env.DB_USER ?? '',
    dbPassword: process.env.DB_PASSWORD ?? '',
    dbName: process.env.DB_NAME ?? 'auctions',
    jwtSecret: process.env.JWT_SECRET ?? 'your-secret-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  };
}
