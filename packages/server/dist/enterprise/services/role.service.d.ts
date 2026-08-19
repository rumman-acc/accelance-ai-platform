import { QueryRunner } from 'typeorm';
import { GeneralSuccessMessage } from '../../utils/constants';
import { Role } from '../database/entities/role.entity';
export declare const enum RoleErrorMessage {
    INVALID_ROLE_ID = "Invalid Role Id",
    INVALID_ROLE_NAME = "Invalid Role Name",
    INVALID_ROLE_PERMISSIONS = "Invalid Role Permissions",
    ROLE_NOT_FOUND = "Role Not Found"
}
export declare class RoleService {
    private dataSource;
    private userService;
    private organizationService;
    constructor();
    validateRoleId(id: string | undefined): void;
    readRoleById(id: string | undefined, queryRunner: QueryRunner): Promise<Role | null>;
    validateRoleName(name: string | undefined): void;
    readRoleByOrganizationId(organizationId: string | undefined, queryRunner: QueryRunner): Promise<(Role & {
        userCount: number;
    })[]>;
    readRoleByRoleIdOrganizationId(id: string | undefined, organizationId: string | undefined, queryRunner: QueryRunner): Promise<Role | null>;
    readGeneralRoleByName(name: string | undefined, queryRunner: QueryRunner): Promise<Role>;
    readRoleIsGeneral(id: string | undefined, queryRunner: QueryRunner): Promise<Role | null>;
    readRoleByGeneral(queryRunner: QueryRunner): Promise<Role[]>;
    readRole(queryRunner: QueryRunner): Promise<Role[]>;
    saveRole(data: Partial<Role>, queryRunner: QueryRunner): Promise<Partial<Role> & Role>;
    createRole(data: Partial<Role>): Promise<Role>;
    updateRole(newRole: Partial<Role>): Promise<Partial<Role>>;
    deleteRole(organizationId: string | undefined, roleId: string | undefined): Promise<{
        message: GeneralSuccessMessage;
    }>;
}
