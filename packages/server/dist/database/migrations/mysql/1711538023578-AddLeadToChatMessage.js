"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLeadToChatMessage1711538023578 = void 0;
class AddLeadToChatMessage1711538023578 {
    async up(queryRunner) {
        const columnExists = await queryRunner.hasColumn('chat_message', 'leadEmail');
        if (!columnExists)
            queryRunner.query(`ALTER TABLE \`chat_message\` ADD COLUMN \`leadEmail\` TEXT;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`chat_message\` DROP COLUMN \`leadEmail\`;`);
    }
}
exports.AddLeadToChatMessage1711538023578 = AddLeadToChatMessage1711538023578;
//# sourceMappingURL=1711538023578-AddLeadToChatMessage.js.map