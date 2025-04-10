import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from './error.middleware';

/**
 * Middleware to validate request body against a Zod schema
 * @param schema Zod schema to validate against
 */
export const validateRequest = <T extends z.ZodTypeAny>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body against schema
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const errorMessage = result.error.errors
          .map((error) => `${error.path.join('.')}: ${error.message}`)
          .join('; ');

        return next(new AppError(`Validation error: ${errorMessage}`, 400));
      }

      // Replace req.body with validated and transformed data
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};
