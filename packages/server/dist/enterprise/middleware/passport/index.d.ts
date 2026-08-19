import express, { NextFunction, Request, Response } from 'express';
import { IdentityManager } from '../../../IdentityManager';
export declare const initializeJwtCookieMiddleware: (app: express.Application, identityManager: IdentityManager) => Promise<void>;
export declare const setTokenOrCookies: (res: Response, user: any, regenerateRefreshToken: boolean, req?: Request, redirect?: boolean, isSSO?: boolean) => void;
export declare const generateJwtAuthToken: (user: any) => string;
export declare const generateJwtRefreshToken: (user: any) => string;
export declare const verifyToken: (req: Request, res: Response, next: NextFunction) => void;
export declare const verifyTokenForBullMQDashboard: (req: Request, res: Response, next: NextFunction) => void;
