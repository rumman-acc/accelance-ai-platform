import { Organization } from './organization.entity';
import { Role } from './role.entity';
import { User } from './user.entity';
export declare enum OrganizationUserStatus {
    ACTIVE = "active",
    DISABLE = "disable",
    INVITED = "invited"
}
export declare class OrganizationUser {
    organizationId: string;
    organization: Organization;
    userId: string;
    user: User;
    roleId: string;
    role?: Role;
    status?: string;
    createdDate?: Date;
    updatedDate?: Date;
    createdBy?: string;
    createdByUser?: User;
    updatedBy?: string;
    updatedByUser?: User;
}
