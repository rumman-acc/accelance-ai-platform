import { Request, Response, NextFunction } from 'express';
declare const _default: {
    upsertVectorMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    createInternalUpsert: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getRateLimiterMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
};
export default _default;
