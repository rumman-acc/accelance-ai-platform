import { JwtPayload } from './middleware';
export declare function inviteMember(caller: JwtPayload, email: string): Promise<{
    inviteUrl: string;
}>;
export declare function getMembers(caller: JwtPayload): Promise<{
    id: string;
    name: string;
    email: string;
    status: string;
    isAdmin: boolean;
    joinedAt: Date | undefined;
}[]>;
