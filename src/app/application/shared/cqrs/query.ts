/**
 * CQRS Query marker interface.
 */
export interface Query<TResponse> {
  readonly _type: string;
}
