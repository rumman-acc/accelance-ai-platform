import { User } from './user.entity';
import { Role } from './role.entity';
import { Workspace } from './workspace.entity';
export declare enum WorkspaceUserStatus {
    ACTIVE = "active",
    DISABLE = "disable",
    INVITED = "invited"
}
export declare class WorkspaceUser {
    workspaceId: string;
    workspace: Workspace;
    userId: string;
    user: User;
    roleId: string;
    role?: Role;
    status?: string;
    lastLogin?: string;
    createdDate?: Date;
    updatedDate?: Date;
    createdBy?: string;
    createdByUser?: User;
    updatedBy?: string;
    updatedByUser?: User;
}
