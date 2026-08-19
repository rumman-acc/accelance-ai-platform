import { NextFunction, Request, Response } from 'express';
export declare class AccountController {
    register(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    invite(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    verify(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    resendVerificationEmail(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    confirmEmailChange(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    forgotPassword(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    resetPassword(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    createStripeCustomerPortalSession(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    logout(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    delete(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
