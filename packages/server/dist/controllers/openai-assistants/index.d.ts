import { Request, Response, NextFunction } from 'express';
declare const _default: {
    getAllOpenaiAssistants: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getSingleOpenaiAssistant: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    getFileFromAssistant: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    uploadAssistantFiles: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
};
export default _default;
