"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCredentialAccessEntity1780000000000 = void 0;
/**
 * Explicit per-user credential grants. Backfills a grant for every current ACTIVE workspace
 * member of every existing credential's own workspace (the "nothing breaks on deploy day"
 * decision) -- credentials shared cross-workspace via WorkspaceShared are handled separately
 * at read-time by CredentialAccessService.hasAccess(), not backfilled here, since that sharing
 * relationship already encodes which workspaces' members may use the credential.
 */
class AddCredentialAccessEntity1780000000000 {
    constructor() {
        this.name = 'AddCredentialAccessEntity1780000000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "credential_access" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "credentialId" text NOT NULL,
                "userId" text NOT NULL,
                "workspaceId" text NOT NULL,
                "grantedBy" text,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_credential_access_id" PRIMARY KEY ("id")
            );`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_credential_access_credentialId_userId" ON "credential_access"("credentialId", "userId");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_credential_access_userId" ON "credential_access"("userId");`);
        await queryRunner.query(`
            INSERT INTO "credential_access" ("credentialId", "userId", "workspaceId", "grantedBy", "createdDate")
            SELECT c."id", wu."userId", c."workspaceId", NULL, now()
            FROM "credential" c
            JOIN "workspace_user" wu ON wu."workspaceId" = c."workspaceId" AND wu."status" = 'active'
            ON CONFLICT ("credentialId", "userId") DO NOTHING;
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "credential_access";`);
    }
}
exports.AddCredentialAccessEntity1780000000000 = AddCredentialAccessEntity1780000000000;
//# sourceMappingURL=1780000000000-AddCredentialAccessEntity.js.map