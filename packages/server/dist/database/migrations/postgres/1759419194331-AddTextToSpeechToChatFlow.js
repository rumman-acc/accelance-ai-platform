"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTextToSpeechToChatFlow1759419194331 = void 0;
class AddTextToSpeechToChatFlow1759419194331 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_flow" ADD COLUMN IF NOT EXISTS "textToSpeech" TEXT;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_flow" DROP COLUMN "textToSpeech";`);
    }
}
exports.AddTextToSpeechToChatFlow1759419194331 = AddTextToSpeechToChatFlow1759419194331;
//# sourceMappingURL=1759419194331-AddTextToSpeechToChatFlow.js.map