import { NextFunction, Request, Response } from 'express';
export declare class WorkspaceUserController {
    create(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    read(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    update(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    delete(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
