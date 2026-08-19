"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddFollowUpPrompts1726666318346 = void 0;
class AddFollowUpPrompts1726666318346 {
    async up(queryRunner) {
        const columnExistsInChatflow = await queryRunner.hasColumn('chat_flow', 'followUpPrompts');
        if (!columnExistsInChatflow)
            queryRunner.query(`ALTER TABLE \`chat_flow\` ADD COLUMN \`followUpPrompts\` TEXT;`);
        const columnExistsInChatMessage = await queryRunner.hasColumn('chat_message', 'followUpPrompts');
        if (!columnExistsInChatMessage)
            queryRunner.query(`ALTER TABLE \`chat_message\` ADD COLUMN \`followUpPrompts\` TEXT;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`chat_flow\` DROP COLUMN \`followUpPrompts\`;`);
        await queryRunner.query(`ALTER TABLE \`chat_message\` DROP COLUMN \`followUpPrompts\`;`);
    }
}
exports.AddFollowUpPrompts1726666318346 = AddFollowUpPrompts1726666318346;
//# sourceMappingURL=1726666318346-AddFollowUpPrompts.js.map