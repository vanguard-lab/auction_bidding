/**
 * Environment constants.
 */
export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  IS_DEV: (process.env.NODE_ENV ?? 'development') === 'development',
};

export interface EnvironmentVariables {
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
}
