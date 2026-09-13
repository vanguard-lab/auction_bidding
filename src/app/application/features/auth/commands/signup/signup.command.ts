import { Command } from '../../../../shared/cqrs';

export interface SignupCommand extends Command<void> {
  readonly _type: 'SignupCommand';
  readonly email: string;
  readonly password: string;
}
