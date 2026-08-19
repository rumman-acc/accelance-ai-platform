"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTypeToChatFlow1716300000000 = void 0;
class AddTypeToChatFlow1716300000000 {
    async up(queryRunner) {
        const columnExists = await queryRunner.hasColumn('chat_flow', 'type');
        if (!columnExists)
            await queryRunner.query(`ALTER TABLE \`chat_flow\` ADD COLUMN \`type\` TEXT;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`chat_flow\` DROP COLUMN \`type\`;`);
    }
}
exports.AddTypeToChatFlow1716300000000 = AddTypeToChatFlow1716300000000;
//# sourceMappingURL=1716300000000-AddTypeToChatFlow.js.map