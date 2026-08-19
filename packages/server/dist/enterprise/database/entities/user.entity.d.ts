import { LoginMethod } from './login-method.entity';
import { OrganizationUser } from './organization-user.entity';
import { Organization } from './organization.entity';
import { Role } from './role.entity';
import { WorkspaceUser } from './workspace-user.entity';
import { Workspace } from './workspace.entity';
export declare enum UserStatus {
    ACTIVE = "active",
    INVITED = "invited",
    UNVERIFIED = "unverified",
    DELETED = "deleted"
}
export declare class User {
    id: string;
    name: string;
    email: string;
    credential?: string | null;
    tempToken?: string | null;
    tokenExpiry?: Date | null;
    status: string;
    createdDate?: Date;
    updatedDate?: Date;
    createdBy: string;
    createdByUser?: User;
    updatedBy: string;
    updatedByUser?: User;
    createdOrganizations?: Organization[];
    updatedOrganizations?: Organization[];
    createdRoles?: Role[];
    updatedRoles?: Role[];
    createdOrganizationUser?: OrganizationUser[];
    updatedOrganizationUser?: OrganizationUser[];
    createdWorkspace?: Workspace[];
    updatedWorkspace?: Workspace[];
    createdWorkspaceUser?: WorkspaceUser[];
    updatedByWorkspaceUser?: WorkspaceUser[];
    createdByLoginMethod?: LoginMethod[];
    updatedByLoginMethod?: LoginMethod[];
}
