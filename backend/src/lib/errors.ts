export class HttpError extends Error {
  status: number;
  expose: boolean;

  constructor(status: number, message: string, expose = true) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.expose = expose;
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

/** Map common domain errors to HTTP statuses. */
export function statusFromError(error: unknown): number {
  if (isHttpError(error)) return error.status;
  const message = error instanceof Error ? error.message : "";
  if (/not found/i.test(message)) return 404;
  if (/already exists|duplicate/i.test(message)) return 409;
  if (/required|valid|match|characters|invalid/i.test(message)) return 400;
  if (/authentication|unauthorized|session expired|login/i.test(message)) return 401;
  if (/forbidden|not allowed/i.test(message)) return 403;
  return 500;
}
