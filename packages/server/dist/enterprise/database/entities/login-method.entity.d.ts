import { User } from './user.entity';
import { Organization } from './organization.entity';
export declare enum LoginMethodStatus {
    ENABLE = "enable",
    DISABLE = "disable"
}
export declare class LoginMethod {
    id: string;
    organizationId?: string;
    organization?: Organization;
    name: string;
    config: string;
    status?: string;
    createdDate?: Date;
    updatedDate?: Date;
    createdBy?: string;
    createdByUser?: User;
    updatedBy?: string;
    updatedByUser?: User;
}
