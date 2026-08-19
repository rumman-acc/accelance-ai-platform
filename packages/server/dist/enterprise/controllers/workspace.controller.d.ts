import { NextFunction, Request, Response } from 'express';
export declare class WorkspaceController {
    create(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    read(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    switchWorkspace(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    update(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    delete(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getSharedWorkspacesForItem(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    setSharedWorkspacesForItem(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
