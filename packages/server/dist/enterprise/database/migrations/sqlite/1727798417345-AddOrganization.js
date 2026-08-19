"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddOrganization1727798417345 = void 0;
const sqlliteCustomFunctions_1 = require("./sqlliteCustomFunctions");
class AddOrganization1727798417345 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "organization" ("id" varchar PRIMARY KEY NOT NULL, 
"name" text NOT NULL, 
"adminUserId" text, 
"defaultWsId" text, 
"organization_type" text, 
"createdDate" datetime NOT NULL DEFAULT (datetime('now')), 
"updatedDate" datetime NOT NULL DEFAULT (datetime('now')));`);
        await (0, sqlliteCustomFunctions_1.ensureColumnExists)(queryRunner, 'workspace', 'organizationId', 'varchar');
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE organization`);
        await queryRunner.query(`ALTER TABLE "workspace" DROP COLUMN "organizationId";`);
    }
}
exports.AddOrganization1727798417345 = AddOrganization1727798417345;
//# sourceMappingURL=1727798417345-AddOrganization.js.map