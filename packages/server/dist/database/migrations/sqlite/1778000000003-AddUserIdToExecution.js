"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddUserIdToExecution1778000000003 = void 0;
class AddUserIdToExecution1778000000003 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "execution" ADD COLUMN "userId" varchar;`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_execution_userId" ON "execution"("userId");`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_execution_userId";`);
        await queryRunner.query(`ALTER TABLE "execution" DROP COLUMN "userId";`);
    }
}
exports.AddUserIdToExecution1778000000003 = AddUserIdToExecution1778000000003;
//# sourceMappingURL=1778000000003-AddUserIdToExecution.js.map