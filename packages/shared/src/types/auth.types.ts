export interface IUser {
    id: string
    email: string
    name: string
    organizationId: string
    activeWorkspaceId?: string
    createdDate: Date
    updatedDate: Date
}

export interface IJwtPayload {
    sub: string
    email: string
    organizationId: string
    workspaceId: string
    role: UserRole
    iat?: number
    exp?: number
}

export enum UserRole {
    OWNER = 'OWNER',
    ADMIN = 'ADMIN',
    MEMBER = 'MEMBER',
    VIEWER = 'VIEWER'
}
