/**
 * CQRS Handler interface for commands and queries.
 */
export interface Handler<TRequest, TResponse> {
  handle(request: TRequest): Promise<TResponse>;
}
