import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    // Capture original send
    const originalSend = res.send;

    res.send = function (data: any) {
        const duration = Date.now() - start;
        const status = res.statusCode;

        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${status} (${duration}ms)`);

        return originalSend.call(this, data);
    };

    next();
};

export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.method} ${req.path} not found`,
    });
};
