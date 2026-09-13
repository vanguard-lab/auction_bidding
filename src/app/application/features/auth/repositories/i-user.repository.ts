import { User } from '../domain';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  exists(email: string): Promise<boolean>;
  save(user: User): Promise<void>;
}
