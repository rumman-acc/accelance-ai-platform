"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddOrganizationAnalytic1783000000000 = void 0;
const sqlliteCustomFunctions_1 = require("./sqlliteCustomFunctions");
class AddOrganizationAnalytic1783000000000 {
    async up(queryRunner) {
        await (0, sqlliteCustomFunctions_1.ensureColumnExists)(queryRunner, 'organization', 'analytic', 'TEXT');
    }
    async down(queryRunner) {
        await queryRunner.query(`
            CREATE TABLE "temp_organization" (
                "id" varchar PRIMARY KEY NOT NULL,
                "name" varchar(100) NOT NULL DEFAULT ('Default Organization'),
                "slug" varchar(120) NOT NULL,
                "customerId" varchar(100),
                "subscriptionId" varchar(100),
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now')),
                "createdBy" varchar NOT NULL,
                "updatedBy" varchar NOT NULL,
                UNIQUE ("slug"),
                FOREIGN KEY ("createdBy") REFERENCES "user" ("id"),
                FOREIGN KEY ("updatedBy") REFERENCES "user" ("id")
            );
        `);
        await queryRunner.query(`
            INSERT INTO "temp_organization" (
                "id",
                "name",
                "slug",
                "customerId",
                "subscriptionId",
                "createdDate",
                "updatedDate",
                "createdBy",
                "updatedBy"
            )
            SELECT
                "id",
                "name",
                "slug",
                "customerId",
                "subscriptionId",
                "createdDate",
                "updatedDate",
                "createdBy",
                "updatedBy"
            FROM "organization";
        `);
        await queryRunner.query(`DROP TABLE "organization";`);
        await queryRunner.query(`ALTER TABLE "temp_organization" RENAME TO "organization";`);
    }
}
exports.AddOrganizationAnalytic1783000000000 = AddOrganizationAnalytic1783000000000;
//# sourceMappingURL=1783000000000-AddOrganizationAnalytic.js.map