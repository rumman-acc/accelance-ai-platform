"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddArtifactsToChatMessage1726156258465 = void 0;
class AddArtifactsToChatMessage1726156258465 {
    async up(queryRunner) {
        const columnExists = await queryRunner.hasColumn('chat_message', 'artifacts');
        if (!columnExists)
            queryRunner.query(`ALTER TABLE \`chat_message\` ADD COLUMN \`artifacts\` LONGTEXT;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`chat_message\` DROP COLUMN \`artifacts\`;`);
    }
}
exports.AddArtifactsToChatMessage1726156258465 = AddArtifactsToChatMessage1726156258465;
//# sourceMappingURL=1726156258465-AddArtifactsToChatMessage.js.map