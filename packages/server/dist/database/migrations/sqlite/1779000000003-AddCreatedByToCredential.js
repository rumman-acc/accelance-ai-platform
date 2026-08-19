"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCreatedByToCredential1779000000003 = void 0;
class AddCreatedByToCredential1779000000003 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "credential" ADD COLUMN "createdBy" varchar;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "credential" DROP COLUMN "createdBy";`);
    }
}
exports.AddCreatedByToCredential1779000000003 = AddCreatedByToCredential1779000000003;
//# sourceMappingURL=1779000000003-AddCreatedByToCredential.js.map