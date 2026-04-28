import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

interface AppError extends Error {
    statusCode?: number;
    details?: unknown;
}

export const errorHandler = (
    error: AppError | Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const isDev = process.env.NODE_ENV === 'development';

    // Zod validation error
    if (error instanceof ZodError) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation error',
            errors: error.errors,
        });
    }

    const statusCode = (error as AppError).statusCode || 500;
    const message = error.message || 'Internal Server Error';

    console.error(`[${statusCode}] ${message}`, error);

    res.status(statusCode).json({
        status: 'error',
        message,
        ...(isDev && { stack: error.stack, details: (error as AppError).details }),
    });
};

export class ApiError extends Error {
    constructor(public statusCode: number, message: string, public details?: unknown) {
        super(message);
        this.name = 'ApiError';
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}
