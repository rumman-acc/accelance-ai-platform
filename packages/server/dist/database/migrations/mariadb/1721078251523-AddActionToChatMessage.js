"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddActionToChatMessage1721078251523 = void 0;
class AddActionToChatMessage1721078251523 {
    async up(queryRunner) {
        const columnExists = await queryRunner.hasColumn('chat_message', 'action');
        if (!columnExists)
            queryRunner.query(`ALTER TABLE \`chat_message\` ADD COLUMN \`action\` LONGTEXT;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`chat_message\` DROP COLUMN \`action\`;`);
    }
}
exports.AddActionToChatMessage1721078251523 = AddActionToChatMessage1721078251523;
//# sourceMappingURL=1721078251523-AddActionToChatMessage.js.map