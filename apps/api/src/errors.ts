export class AppError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function notFound(what: string): AppError {
  return new AppError(404, `${what} not found`);
}
