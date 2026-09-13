import { Request, Response, NextFunction } from 'express';
import { Mediator } from '../../shared/cqrs';
import { SignupRequest, LoginRequest, AuthResponse } from './models';
import { SignupCommand, LoginCommand } from './commands';
import { ValidationResult } from '../../shared/validation';

export class AuthController {
  constructor(
    private readonly mediator: Mediator,
    private readonly signupValidator: { validate: (req: SignupRequest) => ValidationResult },
    private readonly loginValidator: { validate: (req: LoginRequest) => ValidationResult }
  ) {}

  public signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload: SignupRequest = req.body;

      const validation = this.signupValidator.validate(payload);
      if (!validation.isValid) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          errors: validation.errors,
        });
        return;
      }

      const command: SignupCommand = {
        _type: 'SignupCommand',
        email: payload.email,
        password: payload.password,
      };

      const result: AuthResponse = await this.mediator.send(command);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload: LoginRequest = req.body;

      const validation = this.loginValidator.validate(payload);
      if (!validation.isValid) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          errors: validation.errors,
        });
        return;
      }

      const command: LoginCommand = {
        _type: 'LoginCommand',
        email: payload.email,
        password: payload.password,
      };

      const result: AuthResponse = await this.mediator.send(command);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
