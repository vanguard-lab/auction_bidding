import { Handler } from '../../../../shared/cqrs';
import { LoginCommand } from './login.command';
import { AuthResponse } from '../../models';
import { IUserRepository } from '../../repositories';
import { InvalidCredentialsException } from '../../exceptions';
import { IPasswordService, IJwtService } from '../../../../shared/security';

export class LoginHandler implements Handler<LoginCommand, AuthResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly jwtService: IJwtService
  ) {}

  public async handle(command: LoginCommand): Promise<AuthResponse> {
    const normalizedEmail = command.email.toLowerCase().trim();

    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    const valid = await this.passwordService.compare(command.password, user.passwordHash);
    if (!valid) {
      throw new InvalidCredentialsException();
    }

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
