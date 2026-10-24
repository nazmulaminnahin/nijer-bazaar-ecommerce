import { Response } from 'express';

export function ok<T>(res: Response, data: T, message = 'Success', status = 200): void {
  res.status(status).json({ success: true, message, data });
}

export function paginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'Success'
): void {
  res.json({
    success: true,
    message,
    data,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}