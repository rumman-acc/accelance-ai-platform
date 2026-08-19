import { Request, Response, NextFunction } from 'express';
declare const _default: {
    getAllNodes: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getNodeByName: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getSingleNodeIcon: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getSingleNodeAsyncOptions: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    executeCustomFunction: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getNodesByCategory: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
};
export default _default;
