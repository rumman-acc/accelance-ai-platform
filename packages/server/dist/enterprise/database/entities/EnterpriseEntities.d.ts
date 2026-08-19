import { ILoginActivity, IWorkspaceShared, IWorkspaceUser } from '../../Interface.Enterprise';
export declare class WorkspaceUsers implements IWorkspaceUser {
    id: string;
    workspaceId: string;
    userId: string;
    role: string;
}
export declare class WorkspaceShared implements IWorkspaceShared {
    id: string;
    workspaceId: string;
    sharedItemId: string;
    itemType: string;
    createdDate: Date;
    updatedDate: Date;
}
export declare class LoginActivity implements ILoginActivity {
    id: string;
    username: string;
    activityCode: number;
    loginMode: string;
    message: string;
    attemptedDateTime: Date;
    organizationId?: string;
}
