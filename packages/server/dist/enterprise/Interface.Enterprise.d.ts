import { z } from 'zod/v3';
export declare enum UserStatus {
    INVITED = "invited",
    DISABLED = "disabled",
    ACTIVE = "active"
}
export declare class IUser {
    id: string;
    email: string;
    name: string;
    credential: string;
    status: UserStatus;
    tempToken: string;
    tokenExpiry?: Date;
    role: string;
    lastLogin: Date;
    activeWorkspaceId: string;
    loginMode?: string;
    activeOrganizationId?: string;
}
export interface IWorkspaceUser {
    id: string;
    workspaceId: string;
    userId: string;
    role: string;
}
export interface IWorkspaceShared {
    id: string;
    workspaceId: string;
    sharedItemId: string;
    itemType: string;
    createdDate: Date;
    updatedDate: Date;
}
export interface ILoginActivity {
    id: string;
    username: string;
    activityCode: number;
    message: string;
    loginMode: string;
    attemptedDateTime: Date;
    organizationId?: string;
}
export declare enum LoginActivityCode {
    LOGIN_SUCCESS = 0,
    LOGOUT_SUCCESS = 1,
    UNKNOWN_USER = -1,
    INCORRECT_CREDENTIAL = -2,
    USER_DISABLED = -3,
    NO_ASSIGNED_WORKSPACE = -4,
    INVALID_LOGIN_MODE = -5,
    REGISTRATION_PENDING = -6,
    UNKNOWN_ERROR = -99
}
export type IAssignedWorkspace = {
    id: string;
    name: string;
    role: string;
    organizationId: string;
};
export type LoggedInUser = {
    id: string;
    email: string;
    name: string;
    roleId: string;
    activeOrganizationId: string;
    activeOrganizationSubscriptionId: string;
    activeOrganizationCustomerId: string;
    activeOrganizationProductId: string;
    isOrganizationAdmin: boolean;
    activeWorkspaceId: string;
    activeWorkspace: string;
    assignedWorkspaces: IAssignedWorkspace[];
    permissions: string[];
    features?: Record<string, string>;
    ssoRefreshToken?: string;
    ssoToken?: string;
    ssoProvider?: string;
};
export declare enum ErrorMessage {
    INVALID_MISSING_TOKEN = "Invalid or Missing token",
    TOKEN_EXPIRED = "Token Expired",
    REFRESH_TOKEN_EXPIRED = "Refresh Token Expired",
    FORBIDDEN = "Forbidden",
    UNKNOWN_USER = "Unknown Username or Password",
    INCORRECT_PASSWORD = "Incorrect Password",
    INACTIVE_USER = "Inactive User",
    INVITED_USER = "User Invited, but has not registered",
    INVALID_WORKSPACE = "No Workspace Assigned",
    UNKNOWN_ERROR = "Unknown Error"
}
export declare const OrgSetupSchema: z.ZodEffects<z.ZodObject<{
    orgName: z.ZodString;
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    orgName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}, {
    orgName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}>, {
    orgName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}, {
    orgName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}>;
export declare const RegisterUserSchema: z.ZodEffects<z.ZodObject<{
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    token: string;
}, {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    token: string;
}>, {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    token: string;
}, {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    token: string;
}>;
