import { QueryRunner } from 'typeorm';
import { OrganizationUser } from '../database/entities/organization-user.entity';
import { Organization } from '../database/entities/organization.entity';
export declare const enum OrganizationUserErrorMessage {
    INVALID_ORGANIZATION_USER_SATUS = "Invalid Organization User Status",
    ORGANIZATION_USER_ALREADY_EXISTS = "Organization User Already Exists",
    ORGANIZATION_USER_NOT_FOUND = "Organization User Not Found"
}
export declare class OrganizationUserService {
    private dataSource;
    private userService;
    private organizationService;
    private roleService;
    constructor();
    validateOrganizationUserStatus(status: string | undefined): void;
    readOrganizationUserByOrganizationIdUserId(organizationId: string | undefined, userId: string | undefined, queryRunner: QueryRunner): Promise<{
        organization: Organization;
        organizationUser: {
            isOrgOwner: boolean;
            organizationId: string;
            organization: Organization;
            userId: string;
            user: import("../database/entities/user.entity").User;
            roleId: string;
            role?: import("../database/entities/role.entity").Role;
            status?: string;
            createdDate?: Date;
            updatedDate?: Date;
            createdBy?: string;
            createdByUser?: import("../database/entities/user.entity").User;
            updatedBy?: string;
            updatedByUser?: import("../database/entities/user.entity").User;
        } | null;
    }>;
    readOrganizationUserByWorkspaceIdUserId(workspaceId: string | undefined, userId: string | undefined, queryRunner: QueryRunner): Promise<{
        organization: Organization;
        organizationUser: {
            isOrgOwner: boolean;
            organizationId: string;
            organization: Organization;
            userId: string;
            user: import("../database/entities/user.entity").User;
            roleId: string;
            role?: import("../database/entities/role.entity").Role;
            status?: string;
            createdDate?: Date;
            updatedDate?: Date;
            createdBy?: string;
            createdByUser?: import("../database/entities/user.entity").User;
            updatedBy?: string;
            updatedByUser?: import("../database/entities/user.entity").User;
        } | null;
    }>;
    readOrganizationUserByOrganizationId(organizationId: string | undefined, queryRunner: QueryRunner): Promise<{
        isOrgOwner: boolean;
        lastLogin: string | null;
        roleCount: number;
        organizationId: string;
        organization: Organization;
        userId: string;
        user: import("../database/entities/user.entity").User;
        roleId: string;
        role?: import("../database/entities/role.entity").Role;
        status?: string;
        createdDate?: Date;
        updatedDate?: Date;
        createdBy?: string;
        createdByUser?: import("../database/entities/user.entity").User;
        updatedBy?: string;
        updatedByUser?: import("../database/entities/user.entity").User;
    }[]>;
    readOrganizationUserByOrganizationIdRoleId(organizationId: string | undefined, roleId: string | undefined, queryRunner: QueryRunner): Promise<{
        isOrgOwner: boolean;
        organizationId: string;
        organization: Organization;
        userId: string;
        user: import("../database/entities/user.entity").User;
        roleId: string;
        role?: import("../database/entities/role.entity").Role;
        status?: string;
        createdDate?: Date;
        updatedDate?: Date;
        createdBy?: string;
        createdByUser?: import("../database/entities/user.entity").User;
        updatedBy?: string;
        updatedByUser?: import("../database/entities/user.entity").User;
    }[]>;
    readOrganizationUserByUserId(userId: string | undefined, queryRunner: QueryRunner): Promise<{
        isOrgOwner: boolean;
        organizationId: string;
        organization: Organization;
        userId: string;
        user: import("../database/entities/user.entity").User;
        roleId: string;
        role?: import("../database/entities/role.entity").Role;
        status?: string;
        createdDate?: Date;
        updatedDate?: Date;
        createdBy?: string;
        createdByUser?: import("../database/entities/user.entity").User;
        updatedBy?: string;
        updatedByUser?: import("../database/entities/user.entity").User;
    }[]>;
    readOrgUsersCountByOrgId(organizationId: string): Promise<number>;
    createNewOrganizationUser(data: Partial<OrganizationUser>, queryRunner: QueryRunner): OrganizationUser;
    saveOrganizationUser(data: Partial<OrganizationUser>, queryRunner: QueryRunner): Promise<Partial<OrganizationUser> & OrganizationUser>;
    createOrganizationUser(data: Partial<OrganizationUser>): Promise<OrganizationUser>;
    createOrganization(data: Partial<Organization>): Promise<Organization>;
    updateOrganizationUser(newOrganizationUser: Partial<OrganizationUser>): Promise<Partial<OrganizationUser>>;
    deleteOrganizationUser(queryRunner: QueryRunner, organizationId: string | undefined, userId: string | undefined): Promise<{
        isOrgOwner: boolean;
        organizationId: string;
        organization: Organization;
        userId: string;
        user: import("../database/entities/user.entity").User;
        roleId: string;
        role?: import("../database/entities/role.entity").Role;
        status?: string;
        createdDate?: Date;
        updatedDate?: Date;
        createdBy?: string;
        createdByUser?: import("../database/entities/user.entity").User;
        updatedBy?: string;
        updatedByUser?: import("../database/entities/user.entity").User;
    }>;
}
