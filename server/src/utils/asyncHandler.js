// Wrap async route handlers so thrown errors reach the Express error middleware.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Small helper to throw HTTP errors with a status code.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const httpError = (status, message) => new HttpError(status, message);
