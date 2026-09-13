import { Command } from '../../../../shared/cqrs';

export interface LoginCommand extends Command<void> {
  readonly _type: 'LoginCommand';
  readonly email: string;
  readonly password: string;
}
