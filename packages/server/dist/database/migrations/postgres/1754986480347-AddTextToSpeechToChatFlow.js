"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTextToSpeechToChatFlow1754986480347 = void 0;
class AddTextToSpeechToChatFlow1754986480347 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_flow" ADD COLUMN IF NOT EXISTS "textToSpeech" TEXT;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_flow" DROP COLUMN "textToSpeech";`);
    }
}
exports.AddTextToSpeechToChatFlow1754986480347 = AddTextToSpeechToChatFlow1754986480347;
//# sourceMappingURL=1754986480347-AddTextToSpeechToChatFlow.js.map