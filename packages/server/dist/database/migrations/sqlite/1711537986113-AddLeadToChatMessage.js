"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLeadToChatMessage1711537986113 = void 0;
class AddLeadToChatMessage1711537986113 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_message" ADD COLUMN "leadEmail" TEXT;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "leadEmail";`);
    }
}
exports.AddLeadToChatMessage1711537986113 = AddLeadToChatMessage1711537986113;
//# sourceMappingURL=1711537986113-AddLeadToChatMessage.js.map