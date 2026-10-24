import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';
import { ApiError } from '../utils/ApiError';

export function validate(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return next(new ApiError(422, 'Validation failed', errors));
    }
    req.body = result.data;
    next();
  };
}