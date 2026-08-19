"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddFollowUpPrompts1726666309552 = void 0;
class AddFollowUpPrompts1726666309552 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_flow" ADD COLUMN IF NOT EXISTS "followUpPrompts" TEXT;`);
        await queryRunner.query(`ALTER TABLE "chat_message" ADD COLUMN IF NOT EXISTS "followUpPrompts" TEXT;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_flow" DROP COLUMN "followUpPrompts";`);
        await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "followUpPrompts";`);
    }
}
exports.AddFollowUpPrompts1726666309552 = AddFollowUpPrompts1726666309552;
//# sourceMappingURL=1726666309552-AddFollowUpPrompts.js.map