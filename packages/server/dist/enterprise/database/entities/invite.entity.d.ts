export declare class Invite {
    id: string;
    email: string;
    organizationId: string;
    workspaceId: string;
    token: string;
    expiresAt: Date;
    usedAt?: Date | null;
    createdBy: string;
    createdDate?: Date;
}
