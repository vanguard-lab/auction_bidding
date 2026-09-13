/**
 * CQRS Command marker interface.
 */
export interface Command<TResponse = void> {
  readonly _type: string;
}
