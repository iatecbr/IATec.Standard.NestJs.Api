/**
 * ILogService — contract for the IATec Log Service integration.
 * Equivalent to IATec.Shared.Domain.Contracts.Services.Logging.ILogService.
 */
export interface ILogService {
  send(log: LogDto): Promise<void>;
}

export interface LogDto {
  containerKey: string;
  source: string;
  owner: string;
  action: string;
  content: string;
  date: string;
}
