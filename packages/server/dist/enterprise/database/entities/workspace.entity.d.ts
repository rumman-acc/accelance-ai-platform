import { Organization } from './organization.entity';
import { User } from './user.entity';
export declare enum WorkspaceName {
    DEFAULT_WORKSPACE = "Default Workspace",
    DEFAULT_PERSONAL_WORKSPACE = "Personal Workspace"
}
export declare class Workspace {
    id: string;
    name: string;
    description?: string;
    organizationId?: string;
    organization?: Organization;
    createdDate?: Date;
    updatedDate?: Date;
    createdBy?: string;
    createdByUser?: User;
    updatedBy?: string;
    updatedByUser?: User;
}
