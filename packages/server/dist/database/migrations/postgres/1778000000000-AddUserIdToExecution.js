"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddUserIdToExecution1778000000000 = void 0;
class AddUserIdToExecution1778000000000 {
    constructor() {
        this.name = 'AddUserIdToExecution1778000000000';
    }
    async up(queryRunner) {
        // The triggering user's identity for a run, if any (public/API-key-triggered runs have
        // none) — no FK constraint, since this is soft attribution, not a tenant-partition
        // boundary, and shouldn't block user deletion.
        await queryRunner.query(`ALTER TABLE "execution" ADD COLUMN IF NOT EXISTS "userId" varchar;`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_execution_userId" ON "execution"("userId");`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_execution_userId";`);
        await queryRunner.query(`ALTER TABLE "execution" DROP COLUMN IF EXISTS "userId";`);
    }
}
exports.AddUserIdToExecution1778000000000 = AddUserIdToExecution1778000000000;
//# sourceMappingURL=1778000000000-AddUserIdToExecution.js.map