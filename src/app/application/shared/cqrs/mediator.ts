import { Command } from './command';
import { Handler } from './handler';
import { Query } from './query';

type AnyHandler = Handler<unknown, unknown>;

/**
 * Simple in-memory CQRS mediator.
 * Handlers are registered explicitly at composition root.
 */
export class Mediator {
  private readonly handlers = new Map<string, AnyHandler>();

  public register<TRequest, TResponse>(
    type: string,
    handler: Handler<TRequest, TResponse>
  ): void {
    this.handlers.set(type, handler as AnyHandler);
  }

  public async send<TResponse>(command: Command<TResponse>): Promise<TResponse> {
    const handler = this.handlers.get(command._type);
    if (!handler) {
      throw new Error(`No handler registered for command type: ${command._type}`);
    }
    return handler.handle(command) as Promise<TResponse>;
  }

  public async query<TResponse>(query: Query<TResponse>): Promise<TResponse> {
    const handler = this.handlers.get(query._type);
    if (!handler) {
      throw new Error(`No handler registered for query type: ${query._type}`);
    }
    return handler.handle(query) as Promise<TResponse>;
  }
}
