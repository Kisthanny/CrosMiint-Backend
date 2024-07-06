import { Request, Response, NextFunction } from 'express';

type ErrorResponse = {
    message: string;
    stack?: string;
}

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);

    const response: ErrorResponse = {
        message: err.message,
    };
    
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    res.json(response);
};
