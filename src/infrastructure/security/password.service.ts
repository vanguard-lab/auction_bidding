import { hash, compare } from 'bcrypt';

export interface IPasswordService {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

export class PasswordService implements IPasswordService {
  public async hash(password: string): Promise<string> {
    return hash(password, 12);
  }

  public async compare(password: string, hash: string): Promise<boolean> {
    return compare(password, hash);
  }
}
