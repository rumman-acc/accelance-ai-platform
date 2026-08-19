"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddFollowUpPrompts1726666294213 = void 0;
class AddFollowUpPrompts1726666294213 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_flow" ADD COLUMN "followUpPrompts" TEXT;`);
        await queryRunner.query(`ALTER TABLE "chat_message" ADD COLUMN "followUpPrompts" TEXT;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_flow" DROP COLUMN "followUpPrompts";`);
        await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "followUpPrompts";`);
    }
}
exports.AddFollowUpPrompts1726666294213 = AddFollowUpPrompts1726666294213;
//# sourceMappingURL=1726666294213-AddFollowUpPrompts.js.map