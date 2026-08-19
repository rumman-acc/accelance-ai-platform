import { Request, Response, NextFunction } from 'express';
declare const _default: {
    createLeadInChatflow: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getAllLeadsForChatflow: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
};
export default _default;
