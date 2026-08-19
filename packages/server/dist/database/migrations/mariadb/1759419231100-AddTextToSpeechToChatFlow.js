"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTextToSpeechToChatFlow1759419231100 = void 0;
class AddTextToSpeechToChatFlow1759419231100 {
    async up(queryRunner) {
        const columnExists = await queryRunner.hasColumn('chat_flow', 'textToSpeech');
        if (!columnExists)
            await queryRunner.query(`ALTER TABLE \`chat_flow\` ADD COLUMN \`textToSpeech\` TEXT;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`chat_flow\` DROP COLUMN \`textToSpeech\`;`);
    }
}
exports.AddTextToSpeechToChatFlow1759419231100 = AddTextToSpeechToChatFlow1759419231100;
//# sourceMappingURL=1759419231100-AddTextToSpeechToChatFlow.js.map