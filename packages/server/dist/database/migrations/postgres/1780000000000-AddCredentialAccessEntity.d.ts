import { MigrationInterface, QueryRunner } from 'typeorm';
/**
 * Explicit per-user credential grants. Backfills a grant for every current ACTIVE workspace
 * member of every existing credential's own workspace (the "nothing breaks on deploy day"
 * decision) -- credentials shared cross-workspace via WorkspaceShared are handled separately
 * at read-time by CredentialAccessService.hasAccess(), not backfilled here, since that sharing
 * relationship already encodes which workspaces' members may use the credential.
 */
export declare class AddCredentialAccessEntity1780000000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
