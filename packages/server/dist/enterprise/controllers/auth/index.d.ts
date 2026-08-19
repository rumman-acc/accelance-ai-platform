import { NextFunction, Request, Response } from 'express';
declare const _default: {
    getAllPermissions: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    ssoSuccess: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
};
export default _default;
