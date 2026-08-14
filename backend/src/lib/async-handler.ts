import type { Request, Response, NextFunction, RequestHandler } from "express";
import { isHttpError, statusFromError } from "./errors";

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Wraps async route handlers so rejections reach Express error middleware.
 */
export function asyncHandler(fn: AsyncRoute): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const status = statusFromError(err);
  const message =
    err instanceof Error ? err.message : "Internal server error";

  if (status >= 500) {
    console.error("[API Error]", err);
  }

  const expose =
    isHttpError(err) ? err.expose : status < 500;

  res.status(status).json({
    error: expose ? message : "Internal server error",
  });
}
