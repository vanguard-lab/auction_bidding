import { Repository, DataSource } from 'typeorm';
import { IUserRepository } from '../../../app/application/features/auth';
import { User } from '../../../app/application/features/auth';
import { UserEntity } from '../entities';

export class UserRepository implements IUserRepository {
  private readonly repo: Repository<UserEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(UserEntity);
  }

  public async findByEmail(email: string): Promise<User | null> {
    const row = await this.repo.findOne({ where: { email } });
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
    };
  }

  public async findById(id: string): Promise<User | null> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
    };
  }

  public async exists(email: string): Promise<boolean> {
    const count = await this.repo.count({ where: { email } });
    return count > 0;
  }

  public async save(user: User): Promise<void> {
    const entity = new UserEntity();
    entity.id = user.id;
    entity.email = user.email;
    entity.password_hash = user.passwordHash;
    entity.created_at = new Date();
    entity.updated_at = new Date();
    await this.repo.save(entity);
  }
}
