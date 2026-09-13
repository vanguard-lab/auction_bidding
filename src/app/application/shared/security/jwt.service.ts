export interface IJwtService {
  sign(userId: string): string;
}
