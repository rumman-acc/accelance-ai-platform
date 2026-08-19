import { NextFunction, Request, Response } from 'express';
import { InternalAccelanceError } from '../../errors/internalAccelanceError';
declare function errorHandlerMiddleware(err: InternalAccelanceError, req: Request, res: Response, next: NextFunction): Promise<void>;
export default errorHandlerMiddleware;
