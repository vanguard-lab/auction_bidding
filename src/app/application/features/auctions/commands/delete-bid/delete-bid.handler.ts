import { Handler } from '../../../../shared/cqrs';
import { DeleteBidCommand } from './delete-bid.command';
import { IBidRepository } from '../../repositories';
import { BidNotFoundException } from '../../exceptions';

/**
 * Handles DeleteBidCommand.
 */
export class DeleteBidHandler implements Handler<DeleteBidCommand, void> {
  constructor(private readonly bidRepository: IBidRepository) {}

  public async handle(command: DeleteBidCommand): Promise<void> {
    const bid = await this.bidRepository.findById(command.bidId);
    if (!bid) {
      throw new BidNotFoundException(command.bidId);
    }

    await this.bidRepository.deleteById(command.bidId);
  }
}
