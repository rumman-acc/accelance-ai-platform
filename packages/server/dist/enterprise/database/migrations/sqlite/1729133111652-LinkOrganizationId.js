"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkOrganizationId1729133111652 = void 0;
class LinkOrganizationId1729133111652 {
    constructor() {
        this.name = 'LinkOrganizationId1729133111652';
    }
    async up(queryRunner) {
        // step 1 - create temp table with organizationId as foreign key
        await queryRunner.query(`
                CREATE TABLE "temp_workspace" (
                    "id" varchar PRIMARY KEY NOT NULL, 
                    "name" text NOT NULL, 
                    "description" varchar, 
                    "createdDate" datetime NOT NULL DEFAULT (datetime('now')), 
                    "updatedDate" datetime NOT NULL DEFAULT (datetime('now')), 
                    "organizationId" varchar,
                    FOREIGN KEY ("organizationId") REFERENCES "organization"("id")
                );
            `);
        // step 2 - create index for organizationId in temp_workspace table
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_workspace_organizationId" ON "temp_workspace"("organizationId");`);
        // step 3 - migrate data
        await queryRunner.query(`
                INSERT INTO "temp_workspace" ("id", "name", "description", "createdDate", "updatedDate", "organizationId")
                SELECT "id", "name", "description", "createdDate", "updatedDate", "organizationId" FROM "workspace";
            `);
        // step 4 - drop workspace table
        await queryRunner.query(`DROP TABLE "workspace";`);
        // step 5 - alter temp_workspace to workspace table
        await queryRunner.query(`ALTER TABLE "temp_workspace" RENAME TO "workspace";`);
    }
    async down(queryRunner) {
        // step 1 - create temp table without organizationId as foreign key
        await queryRunner.query(`
            CREATE TABLE "temp_workspace" (
                "id" varchar PRIMARY KEY NOT NULL, 
                "name" text NOT NULL, 
                "description" varchar, 
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')), 
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now')),
                "organizationId" varchar,
            );
        `);
        // step 2 - migrate data
        await queryRunner.query(`
                INSERT INTO "temp_workspace" ("id", "name", "description", "createdDate", "updatedDate", "organizationId")
                SELECT "id", "name", "description", "createdDate", "updatedDate", "organizationId" FROM "workspace";
        `);
        // step 3 - drop workspace table
        await queryRunner.query(`DROP TABLE "workspace";`);
        // step 4 - alter temp_workspace to workspace table
        await queryRunner.query(`ALTER TABLE "temp_workspace" RENAME TO "workspace";`);
    }
}
exports.LinkOrganizationId1729133111652 = LinkOrganizationId1729133111652;
//# sourceMappingURL=1729133111652-LinkOrganizationId.js.map