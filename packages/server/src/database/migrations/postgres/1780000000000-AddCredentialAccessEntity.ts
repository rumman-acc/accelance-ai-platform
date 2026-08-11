import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Explicit per-user credential grants. Backfills a grant for every current ACTIVE workspace
 * member of every existing credential's own workspace (the "nothing breaks on deploy day"
 * decision) -- credentials shared cross-workspace via WorkspaceShared are handled separately
 * at read-time by CredentialAccessService.hasAccess(), not backfilled here, since that sharing
 * relationship already encodes which workspaces' members may use the credential.
 */
export class AddCredentialAccessEntity1780000000000 implements MigrationInterface {
    name = 'AddCredentialAccessEntity1780000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "credential_access" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "credentialId" text NOT NULL,
                "userId" text NOT NULL,
                "workspaceId" text NOT NULL,
                "grantedBy" text,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_credential_access_id" PRIMARY KEY ("id")
            );`
        )
        await queryRunner.query(
            `CREATE UNIQUE INDEX IF NOT EXISTS "idx_credential_access_credentialId_userId" ON "credential_access"("credentialId", "userId");`
        )
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_credential_access_userId" ON "credential_access"("userId");`)

        await queryRunner.query(`
            INSERT INTO "credential_access" ("credentialId", "userId", "workspaceId", "grantedBy", "createdDate")
            SELECT c."id", wu."userId", c."workspaceId", NULL, now()
            FROM "credential" c
            JOIN "workspace_user" wu ON wu."workspaceId" = c."workspaceId" AND wu."status" = 'active'
            ON CONFLICT ("credentialId", "userId") DO NOTHING;
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "credential_access";`)
    }
}
