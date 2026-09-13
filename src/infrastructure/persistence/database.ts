import { DataSource } from 'typeorm';
import { AuctionEntity } from './entities';
import { BidEntity } from './entities';
import { UserEntity } from './entities';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

/**
 * Database schema and connection setup via TypeORM.
 *
 * Concurrency strategy (PostgreSQL):
 * - Uses a conditional UPDATE ... RETURNING * for the critical place-bid operation.
 * - The UPDATE is conditional: it only updates rows where the auction is open
 *   and the new amount is strictly higher than the current top bid.
 * - PostgreSQL row-level locking ensures that only one concurrent transaction
 *   can modify a given row at a time.
 * - The interface remains the same regardless of the underlying database.
 */
export function createDataSource(config: DatabaseConfig): DataSource {
  return new DataSource({
    type: 'postgres',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    synchronize: true,
    entities: [AuctionEntity, BidEntity, UserEntity],
    logging: false,
  });
}
