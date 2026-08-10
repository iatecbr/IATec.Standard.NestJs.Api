/**
 * DI token for ILogService.
 * TypeScript interfaces are erased at runtime, so we use a Symbol.
 * Equivalent to services.AddHttpClient<ILogService, LogService>() in .NET.
 */
export const LOG_SERVICE = Symbol('ILogService');
