import { QueryRunner } from 'typeorm';
import { GeneralSuccessMessage } from '../../utils/constants';
import { WorkspaceUser } from '../database/entities/workspace-user.entity';
import { Workspace } from '../database/entities/workspace.entity';
export declare const enum WorkspaceUserErrorMessage {
    INVALID_WORKSPACE_USER_SATUS = "Invalid Workspace User Status",
    INVALID_WORKSPACE_USER_LASTLOGIN = "Invalid Workspace User LastLogin",
    WORKSPACE_USER_ALREADY_EXISTS = "Workspace User Already Exists",
    WORKSPACE_USER_NOT_FOUND = "Workspace User Not Found"
}
export declare class WorkspaceUserService {
    private dataSource;
    private userService;
    private workspaceService;
    private roleService;
    private organizationService;
    constructor();
    validateWorkspaceUserStatus(status: string | undefined): void;
    validateWorkspaceUserLastLogin(lastLogin: string | undefined): void;
    readWorkspaceUserByWorkspaceIdUserId(workspaceId: string | undefined, userId: string | undefined, queryRunner: QueryRunner): Promise<{
        workspace: Workspace;
        workspaceUser: {
            isOrgOwner: boolean;
            workspaceId: string;
            workspace: Workspace;
            userId: string;
            user: import("../database/entities/user.entity").User;
            roleId: string;
            role?: import("../database/entities/role.entity").Role;
            status?: string;
            lastLogin?: string;
            createdDate?: Date;
            updatedDate?: Date;
            createdBy?: string;
            createdByUser?: import("../database/entities/user.entity").User;
            updatedBy?: string;
            updatedByUser?: import("../database/entities/user.entity").User;
        } | null;
    }>;
    readWorkspaceUserByWorkspaceId(workspaceId: string | undefined, queryRunner: QueryRunner): Promise<{
        isOrgOwner: boolean;
        workspaceId: string;
        workspace: Workspace;
        userId: string;
        user: import("../database/entities/user.entity").User;
        roleId: string;
        role?: import("../database/entities/role.entity").Role;
        status?: string;
        lastLogin?: string;
        createdDate?: Date;
        updatedDate?: Date;
        createdBy?: string;
        createdByUser?: import("../database/entities/user.entity").User;
        updatedBy?: string;
        updatedByUser?: import("../database/entities/user.entity").User;
    }[]>;
    readWorkspaceUserByUserId(userId: string | undefined, queryRunner: QueryRunner): Promise<{
        isOrgOwner: boolean;
        workspaceId: string;
        workspace: Workspace;
        userId: string;
        user: import("../database/entities/user.entity").User;
        roleId: string;
        role?: import("../database/entities/role.entity").Role;
        status?: string;
        lastLogin?: string;
        createdDate?: Date;
        updatedDate?: Date;
        createdBy?: string;
        createdByUser?: import("../database/entities/user.entity").User;
        updatedBy?: string;
        updatedByUser?: import("../database/entities/user.entity").User;
    }[]>;
    readWorkspaceUserByOrganizationIdUserId(organizationId: string | undefined, userId: string | undefined, queryRunner: QueryRunner): Promise<{
        isOrgOwner: boolean;
        workspaceId: string;
        workspace: Workspace;
        userId: string;
        user: import("../database/entities/user.entity").User;
        roleId: string;
        role?: import("../database/entities/role.entity").Role;
        status?: string;
        lastLogin?: string;
        createdDate?: Date;
        updatedDate?: Date;
        createdBy?: string;
        createdByUser?: import("../database/entities/user.entity").User;
        updatedBy?: string;
        updatedByUser?: import("../database/entities/user.entity").User;
    }[]>;
    readWorkspaceUserByOrganizationId(organizationId: string | undefined, queryRunner: QueryRunner): Promise<{
        isOrgOwner: boolean;
        workspaceId: string;
        workspace: Workspace;
        userId: string;
        user: import("../database/entities/user.entity").User;
        roleId: string;
        role?: import("../database/entities/role.entity").Role;
        status?: string;
        lastLogin?: string;
        createdDate?: Date;
        updatedDate?: Date;
        createdBy?: string;
        createdByUser?: import("../database/entities/user.entity").User;
        updatedBy?: string;
        updatedByUser?: import("../database/entities/user.entity").User;
    }[]>;
    readWorkspaceUserByRoleId(roleId: string | undefined, queryRunner: QueryRunner, organizationId?: string | undefined): Promise<{
        isOrgOwner: boolean;
        workspaceId: string;
        workspace: Workspace;
        userId: string;
        user: import("../database/entities/user.entity").User;
        roleId: string;
        role?: import("../database/entities/role.entity").Role;
        status?: string;
        lastLogin?: string;
        createdDate?: Date;
        updatedDate?: Date;
        createdBy?: string;
        createdByUser?: import("../database/entities/user.entity").User;
        updatedBy?: string;
        updatedByUser?: import("../database/entities/user.entity").User;
    }[]>;
    readWorkspaceUserByLastLogin(userId: string | undefined, queryRunner: QueryRunner): Promise<{
        isOrgOwner: boolean;
        workspaceId: string;
        workspace: Workspace;
        userId: string;
        user: import("../database/entities/user.entity").User;
        roleId: string;
        role?: import("../database/entities/role.entity").Role;
        status?: string;
        lastLogin?: string;
        createdDate?: Date;
        updatedDate?: Date;
        createdBy?: string;
        createdByUser?: import("../database/entities/user.entity").User;
        updatedBy?: string;
        updatedByUser?: import("../database/entities/user.entity").User;
    }[] | {
        isOrgOwner: boolean;
        workspaceId: string;
        workspace: Workspace;
        userId: string;
        user: import("../database/entities/user.entity").User;
        roleId: string;
        role?: import("../database/entities/role.entity").Role;
        status?: string;
        lastLogin?: string;
        createdDate?: Date;
        updatedDate?: Date;
        createdBy?: string;
        createdByUser?: import("../database/entities/user.entity").User;
        updatedBy?: string;
        updatedByUser?: import("../database/entities/user.entity").User;
    }>;
    createNewWorkspaceUser(data: Partial<WorkspaceUser>, queryRunner: QueryRunner): WorkspaceUser;
    saveWorkspaceUser(data: Partial<WorkspaceUser>, queryRunner: QueryRunner): Promise<Partial<WorkspaceUser> & WorkspaceUser>;
    createWorkspaceUser(data: Partial<WorkspaceUser>): Promise<WorkspaceUser>;
    createWorkspace(data: Partial<Workspace>): Promise<Workspace>;
    updateWorkspaceUser(newWorkspaserUser: Partial<WorkspaceUser>, queryRunner: QueryRunner): Promise<Partial<WorkspaceUser>>;
    deleteWorkspaceUser(workspaceId: string | undefined, userId: string | undefined): Promise<{
        message: GeneralSuccessMessage;
    }>;
}
