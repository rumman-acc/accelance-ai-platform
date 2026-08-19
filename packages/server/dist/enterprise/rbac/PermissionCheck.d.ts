import { NextFunction, Request, Response } from 'express';
export declare const checkPermission: (permission: string) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const checkAnyPermission: (permissionsString: string) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
