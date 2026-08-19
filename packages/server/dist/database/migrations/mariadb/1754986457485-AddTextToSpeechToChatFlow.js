"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTextToSpeechToChatFlow1754986457485 = void 0;
class AddTextToSpeechToChatFlow1754986457485 {
    async up(queryRunner) {
        const columnExists = await queryRunner.hasColumn('chat_flow', 'textToSpeech');
        if (!columnExists)
            queryRunner.query(`ALTER TABLE \`chat_flow\` ADD COLUMN \`textToSpeech\` TEXT;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`chat_flow\` DROP COLUMN \`textToSpeech\`;`);
    }
}
exports.AddTextToSpeechToChatFlow1754986457485 = AddTextToSpeechToChatFlow1754986457485;
//# sourceMappingURL=1754986457485-AddTextToSpeechToChatFlow.js.map