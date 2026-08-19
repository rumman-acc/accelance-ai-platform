"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLeadToChatMessage1711538016098 = void 0;
class AddLeadToChatMessage1711538016098 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_message" ADD COLUMN IF NOT EXISTS "leadEmail" TEXT;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "leadEmail";`);
    }
}
exports.AddLeadToChatMessage1711538016098 = AddLeadToChatMessage1711538016098;
//# sourceMappingURL=1711538016098-AddLeadToChatMessage.js.map