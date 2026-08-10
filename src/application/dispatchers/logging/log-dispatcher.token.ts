/**
 * DI token for ILogDispatcher — TypeScript interfaces are erased at runtime,
 * so we use a Symbol as the injection token.
 * Equivalent to services.AddScoped<ILogDispatcher, LogDispatcher>() in .NET.
 */
export const LOG_DISPATCHER = Symbol('ILogDispatcher');
