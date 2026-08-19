import { NextFunction, Request, Response } from 'express';
declare const logger: import("winston").Logger;
export declare function expressRequestLogger(req: Request, res: Response, next: NextFunction): void;
export declare const auditLogger: import("winston").Logger;
export default logger;
