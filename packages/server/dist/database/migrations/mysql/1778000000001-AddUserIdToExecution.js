"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddUserIdToExecution1778000000001 = void 0;
class AddUserIdToExecution1778000000001 {
    async up(queryRunner) {
        await queryRunner.query('ALTER TABLE `execution` ADD COLUMN `userId` VARCHAR(36);');
        await queryRunner.query('CREATE INDEX `idx_execution_userId` ON `execution`(`userId`);');
    }
    async down(queryRunner) {
        await queryRunner.query('DROP INDEX `idx_execution_userId` ON `execution`;');
        await queryRunner.query('ALTER TABLE `execution` DROP COLUMN `userId`;');
    }
}
exports.AddUserIdToExecution1778000000001 = AddUserIdToExecution1778000000001;
//# sourceMappingURL=1778000000001-AddUserIdToExecution.js.map