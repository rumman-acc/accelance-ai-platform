import { Request, Response, NextFunction } from 'express';
declare const _default: {
    getAllComponentsCredentials: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getComponentByName: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getSingleComponentsCredentialIcon: (req: Request, res: Response, next: NextFunction) => Promise<void>;
};
export default _default;
