import type { ZodType } from "zod";
import { AppError } from "./errors.js";

export function parse<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
      .join("; ");
    throw new AppError(400, message);
  }
  return result.data;
}
