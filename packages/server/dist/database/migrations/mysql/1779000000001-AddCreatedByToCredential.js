"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCreatedByToCredential1779000000001 = void 0;
class AddCreatedByToCredential1779000000001 {
    async up(queryRunner) {
        await queryRunner.query('ALTER TABLE `credential` ADD COLUMN `createdBy` VARCHAR(36);');
    }
    async down(queryRunner) {
        await queryRunner.query('ALTER TABLE `credential` DROP COLUMN `createdBy`;');
    }
}
exports.AddCreatedByToCredential1779000000001 = AddCreatedByToCredential1779000000001;
//# sourceMappingURL=1779000000001-AddCreatedByToCredential.js.map