import { Organization } from './organization.entity';
import { User } from './user.entity';
export declare enum GeneralRole {
    OWNER = "owner",
    MEMBER = "member",
    PERSONAL_WORKSPACE = "personal workspace"
}
export declare class Role {
    id: string;
    organizationId?: string;
    organization?: Organization;
    name: string;
    description?: string;
    permissions: string;
    createdDate?: Date;
    updatedDate?: Date;
    createdBy?: string;
    createdByUser?: User;
    updatedBy?: string;
    updatedByUser?: User;
}
