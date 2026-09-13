import { Handler } from '../../../../shared/cqrs';
import { SignupCommand } from './signup.command';
import { AuthResponse } from '../../models';
import { IUserRepository } from '../../repositories';
import { IPasswordService, IJwtService } from '../../../../shared/security';
import { UserAlreadyExistsException } from '../../exceptions';
import { User } from '../../domain';
import { randomUUID } from 'crypto';

export class SignupHandler implements Handler<SignupCommand, AuthResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly jwtService: IJwtService
  ) {}

  public async handle(command: SignupCommand): Promise<AuthResponse> {
    const normalizedEmail = command.email.toLowerCase().trim();

    const existing = await this.userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new UserAlreadyExistsException();
    }

    const passwordHash = await this.passwordService.hash(command.password);
    const user: User = {
      id: randomUUID(),
      email: normalizedEmail,
      passwordHash,
    };

    await this.userRepository.save(user);

    const accessToken = this.jwtService.sign(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      access_token: accessToken,
    };
  }
}
