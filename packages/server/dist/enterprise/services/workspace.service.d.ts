import { QueryRunner, UpdateResult } from 'typeorm';
import { Credential } from '../../database/entities/Credential';
import { CustomTemplate } from '../../database/entities/CustomTemplate';
import { GeneralSuccessMessage } from '../../utils/constants';
import { Workspace } from '../database/entities/workspace.entity';
export declare const enum WorkspaceErrorMessage {
    INVALID_WORKSPACE_ID = "Invalid Workspace Id",
    INVALID_WORKSPACE_NAME = "Invalid Workspace Name",
    WORKSPACE_NOT_FOUND = "Workspace Not Found",
    WORKSPACE_RESERVERD_NAME = "Workspace name cannot be Default Workspace or Personal Workspace - this is a reserved name"
}
export declare class WorkspaceService {
    private dataSource;
    private userService;
    private organizationService;
    private roleService;
    constructor();
    validateWorkspaceId(id: string | undefined): void;
    readWorkspaceById(id: string | undefined, queryRunner: QueryRunner): Promise<Workspace | null>;
    validateWorkspaceName(name: string | undefined, isRegister?: boolean): void;
    readWorkspaceByOrganizationId(organizationId: string | undefined, queryRunner: QueryRunner): Promise<(Workspace & {
        userCount: number;
    })[]>;
    createNewWorkspace(data: Partial<Workspace>, queryRunner: QueryRunner, isRegister?: boolean): Workspace;
    saveWorkspace(data: Partial<Workspace>, queryRunner: QueryRunner): Promise<Partial<Workspace> & Workspace>;
    createWorkspace(data: Partial<Workspace>): Promise<Workspace>;
    updateWorkspace(newWorkspaceData: Partial<Workspace>): Promise<Partial<Workspace>>;
    deleteWorkspaceById(queryRunner: QueryRunner, workspaceId: string): Promise<Workspace>;
    getSharedWorkspacesForItem(itemId: string): Promise<{
        workspaceId: string;
        workspaceName: string | undefined;
        sharedItemId: string;
        itemType: string;
    }[]>;
    getSharedItemsForWorkspace(wsId: string, itemType: string): Promise<Credential[] | CustomTemplate[]>;
    setSharedWorkspacesForItem(itemId: string, body: {
        itemType: string;
        workspaceIds: string[];
    }): Promise<{
        message: GeneralSuccessMessage;
    }>;
    /**
     * Updates all entities with null workspaceId to the specified workspaceId
     * Used for migrating legacy data that was created before workspace implementation
     * This function is guaranteed to return meaningful results with affected row counts
     * @param queryRunner The TypeORM query runner to execute database operations
     * @param workspaceId The target workspaceId to assign to records with null workspaceId
     * @returns An array of update results, each containing the count of affected rows.
     * The array will always contain results for each entity type in the following order:
     * [ApiKey, Assistant, ChatFlow, Credential, CustomTemplate, Dataset, DocumentStore, Evaluation, Evaluator, Tool, Variable]
     */
    setNullWorkspaceId(queryRunner: QueryRunner, workspaceId: string): Promise<UpdateResult[]>;
}
