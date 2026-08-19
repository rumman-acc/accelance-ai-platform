"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCreatedByToCredential1779000000002 = void 0;
class AddCreatedByToCredential1779000000002 {
    async up(queryRunner) {
        await queryRunner.query('ALTER TABLE `credential` ADD COLUMN `createdBy` VARCHAR(36);');
    }
    async down(queryRunner) {
        await queryRunner.query('ALTER TABLE `credential` DROP COLUMN `createdBy`;');
    }
}
exports.AddCreatedByToCredential1779000000002 = AddCreatedByToCredential1779000000002;
//# sourceMappingURL=1779000000002-AddCreatedByToCredential.js.map