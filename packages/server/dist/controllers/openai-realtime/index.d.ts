import { Request, Response, NextFunction } from 'express';
declare const _default: {
    getAgentTools: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    executeAgentTool: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
};
export default _default;
