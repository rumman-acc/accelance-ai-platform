"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddOrganizationAnalytic1783000000000 = void 0;
class AddOrganizationAnalytic1783000000000 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "analytic" text;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN IF EXISTS "analytic";`);
    }
}
exports.AddOrganizationAnalytic1783000000000 = AddOrganizationAnalytic1783000000000;
//# sourceMappingURL=1783000000000-AddOrganizationAnalytic.js.map