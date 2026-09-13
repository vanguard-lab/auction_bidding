import 'dotenv/config';
import 'reflect-metadata';
import { main } from './main';

main().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
