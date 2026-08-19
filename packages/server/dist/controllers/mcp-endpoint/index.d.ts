import { NextFunction, Request, Response } from 'express';
declare const _default: {
    authenticateToken: (req: Request, res: Response, next: NextFunction) => void;
    handlePost: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    handleDelete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getRateLimiterMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
};
export default _default;
