/**
 * ILogDispatcher — contract for dispatching logs to external services.
 * Equivalent to IATec.Shared.Domain.Contracts.Dispatcher.ILogDispatcher.
 */
export interface ILogDispatcher {
  dispatch(
    source: string,
    owner: string,
    action: string,
    content?: string,
  ): Promise<void>;
}
