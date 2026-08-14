import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCustomMcpServerStdioTransport1790000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "temp_custom_mcp_server" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "serverUrl" text, "iconSrc" varchar, "color" varchar, "authType" varchar NOT NULL DEFAULT ('NONE'), "authConfig" text, "tools" text, "toolCount" integer NOT NULL DEFAULT (0), "status" varchar NOT NULL DEFAULT ('PENDING'), "createdDate" datetime NOT NULL DEFAULT (datetime('now')), "updatedDate" datetime NOT NULL DEFAULT (datetime('now')), "workspaceId" text NOT NULL, "transportType" varchar NOT NULL DEFAULT ('url'), "command" varchar, "args" text, "env" text);`
        )
        await queryRunner.query(
            `INSERT INTO "temp_custom_mcp_server" ("id", "name", "serverUrl", "iconSrc", "color", "authType", "authConfig", "tools", "toolCount", "status", "createdDate", "updatedDate", "workspaceId") SELECT "id", "name", "serverUrl", "iconSrc", "color", "authType", "authConfig", "tools", "toolCount", "status", "createdDate", "updatedDate", "workspaceId" FROM "custom_mcp_server";`
        )
        await queryRunner.query(`DROP TABLE "custom_mcp_server";`)
        await queryRunner.query(`ALTER TABLE "temp_custom_mcp_server" RENAME TO "custom_mcp_server";`)
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_custom_mcp_workspace_updated" ON "custom_mcp_server" ("workspaceId", "updatedDate");`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_custom_mcp_workspace_updated"`)
        await queryRunner.query(`DROP TABLE "custom_mcp_server"`)
    }
}
