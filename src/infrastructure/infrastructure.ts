import { DataSource } from 'typeorm';
import { createDataSource } from './persistence';
import { AuctionRepository, BidRepository, UserRepository } from './persistence';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

/**
 * Infrastructure composition.
 * Creates and exposes concrete infrastructure instances.
 */
export interface Infrastructure {
  dataSource: DataSource;
  auctionRepository: AuctionRepository;
  bidRepository: BidRepository;
  userRepository: UserRepository;
}

export async function createInfrastructure(config: DatabaseConfig): Promise<Infrastructure> {
  const dataSource = createDataSource(config);
  await dataSource.initialize();

  const auctionRepository = new AuctionRepository(dataSource);
  const bidRepository = new BidRepository(dataSource);
  const userRepository = new UserRepository(dataSource);

  return {
    dataSource,
    auctionRepository,
    bidRepository,
    userRepository,
  };
}
