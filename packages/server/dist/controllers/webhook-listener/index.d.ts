import { Request, Response, NextFunction } from 'express';
declare const _default: {
    registerListener: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    streamListener: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    unregisterListener: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
};
export default _default;
