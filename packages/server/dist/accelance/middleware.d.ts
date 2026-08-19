import { NextFunction, Request, Response } from 'express';
export interface JwtPayload {
    sub: string;
    email: string;
    tenantId: string;
    workspaceId: string;
    role: string;
    iat?: number;
    exp?: number;
}
export declare function getJwtSecret(): string;
export declare function extractToken(req: Request): string | null;
export declare function requireAuth(req: Request, res: Response, next: NextFunction): void;
