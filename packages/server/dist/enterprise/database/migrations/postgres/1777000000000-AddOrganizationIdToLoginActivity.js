"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddOrganizationIdToLoginActivity1777000000000 = void 0;
class AddOrganizationIdToLoginActivity1777000000000 {
    async up(queryRunner) {
        // step 1 - add organizationId column
        await queryRunner.query(`ALTER TABLE "login_activity" ADD COLUMN IF NOT EXISTS "organizationId" uuid;`);
        // step 2 - add foreign key constraint (nullable: pre-existing rows and unattributable
        // failed-login attempts have no resolvable organization)
        await queryRunner.query(`
            ALTER TABLE "login_activity" ADD CONSTRAINT "fk_login_activity_organizationId" FOREIGN KEY ("organizationId") REFERENCES "organization"("id");
        `);
        // step 3 - create index, since every read of this table is now filtered by organizationId
        await queryRunner.query(`
            CREATE INDEX "idx_login_activity_organizationId" ON "login_activity"("organizationId");
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "idx_login_activity_organizationId";`);
        await queryRunner.query(`ALTER TABLE "login_activity" DROP CONSTRAINT "fk_login_activity_organizationId";`);
        await queryRunner.query(`ALTER TABLE "login_activity" DROP COLUMN "organizationId";`);
    }
}
exports.AddOrganizationIdToLoginActivity1777000000000 = AddOrganizationIdToLoginActivity1777000000000;
//# sourceMappingURL=1777000000000-AddOrganizationIdToLoginActivity.js.map