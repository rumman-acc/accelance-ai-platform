"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTextToSpeechToChatFlow1754986486669 = void 0;
class AddTextToSpeechToChatFlow1754986486669 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_flow" ADD COLUMN "textToSpeech" TEXT;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_flow" DROP COLUMN "textToSpeech";`);
    }
}
exports.AddTextToSpeechToChatFlow1754986486669 = AddTextToSpeechToChatFlow1754986486669;
//# sourceMappingURL=1754986486669-AddTextToSpeechToChatFlow.js.map