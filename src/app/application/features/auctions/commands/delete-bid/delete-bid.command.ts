import { Command } from '../../../../shared/cqrs';

/**
 * Command to delete a bid by its id.
 */
export interface DeleteBidCommand extends Command<void> {
  readonly _type: 'DeleteBidCommand';
  readonly bidId: string;
}
