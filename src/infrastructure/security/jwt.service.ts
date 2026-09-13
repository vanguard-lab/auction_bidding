import { sign, SignOptions } from 'jsonwebtoken';

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface IJwtService {
  sign(userId: string): string;
}

export class JwtService implements IJwtService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string
  ) {}

  public sign(userId: string): string {
    const options: SignOptions = {
      expiresIn: this.expiresIn as any,
    };
    return sign({ sub: userId }, this.secret, options);
  }
}
