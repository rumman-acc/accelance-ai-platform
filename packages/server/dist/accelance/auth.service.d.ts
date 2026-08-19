import { JwtPayload } from './middleware';
export declare function register(dto: {
    name: string;
    email: string;
    password: string;
    inviteToken?: string;
}): Promise<{
    token: string;
    expiresIn: string;
    user: {
        id: string;
        name: string;
        email: string;
        tenantId: string;
        workspaceId: string;
        role: string;
    };
}>;
export declare function login(dto: {
    email: string;
    password: string;
}): Promise<{
    token: string;
    expiresIn: string;
    user: {
        id: string;
        name: string;
        email: string;
        tenantId: string;
        workspaceId: string;
        role: string;
    };
}>;
export declare function generateCanvasToken(user: JwtPayload): {
    token: string;
};
