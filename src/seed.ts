import 'reflect-metadata';
import { createDataSource } from './infrastructure/persistence';
import { AuctionEntity } from './infrastructure/persistence';
import { randomUUID } from 'crypto';

/**
 * Seed script: creates sample auctions for testing.
 */
async function seedDatabase(): Promise<void> {
  const dataSource = createDataSource({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'auctions',
  });
  await dataSource.initialize();

  const repo = dataSource.getRepository(AuctionEntity);
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  const auction1 = new AuctionEntity();
  auction1.id = randomUUID();
  auction1.status = 'OPEN';
  auction1.starts_at = oneHourAgo;
  auction1.ends_at = oneHourLater;
  auction1.current_top_bid = null;
  auction1.current_top_bidder_id = null;
  auction1.created_at = now;

  const auction2 = new AuctionEntity();
  auction2.id = randomUUID();
  auction2.status = 'OPEN';
  auction2.starts_at = oneHourAgo;
  auction2.ends_at = oneHourLater;
  auction2.current_top_bid = null;
  auction2.current_top_bidder_id = null;
  auction2.created_at = now;

  await repo.save([auction1, auction2]);

  console.log('Database seeded with sample auctions.');

  await dataSource.destroy();
  console.log('Done.');
}

seedDatabase().catch((err) => {
  console.error('Failed to seed database:', err);
  process.exit(1);
});
