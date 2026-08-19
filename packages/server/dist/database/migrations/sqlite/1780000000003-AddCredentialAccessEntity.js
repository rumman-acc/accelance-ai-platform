"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCredentialAccessEntity1780000000003 = void 0;
// sqlite has no native UUID function -- this builds a v4-shaped random id inline for the
// one-time backfill, matching the pattern other projects use for sqlite data migrations.
const SQLITE_UUID_V4_EXPR = `(
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
    substr(lower(hex(randomblob(2))), 2) || '-' ||
    substr('89ab', (abs(random()) % 4) + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
    lower(hex(randomblob(6)))
)`;
class AddCredentialAccessEntity1780000000003 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "credential_access" (
                "id" varchar PRIMARY KEY NOT NULL,
                "credentialId" varchar NOT NULL,
                "userId" varchar NOT NULL,
                "workspaceId" varchar NOT NULL,
                "grantedBy" varchar,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "idx_credential_access_credentialId_userId" UNIQUE ("credentialId", "userId")
            );`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_credential_access_userId" ON "credential_access"("userId");`);
        await queryRunner.query(`
            INSERT OR IGNORE INTO "credential_access" ("id", "credentialId", "userId", "workspaceId", "createdDate")
            SELECT ${SQLITE_UUID_V4_EXPR}, c."id", wu."userId", c."workspaceId", datetime('now')
            FROM "credential" c
            JOIN "workspace_user" wu ON wu."workspaceId" = c."workspaceId" AND wu."status" = 'active';
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "credential_access";`);
    }
}
exports.AddCredentialAccessEntity1780000000003 = AddCredentialAccessEntity1780000000003;
//# sourceMappingURL=1780000000003-AddCredentialAccessEntity.js.map