"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixOpenSourceAssistantTable1743758056188 = void 0;
class FixOpenSourceAssistantTable1743758056188 {
    constructor() {
        this.name = 'FixOpenSourceAssistantTable1743758056188';
    }
    async up(queryRunner) {
        const columnExists = await queryRunner.hasColumn('assistant', 'type');
        if (!columnExists) {
            await queryRunner.query(`ALTER TABLE \`assistant\` ADD COLUMN \`type\` TEXT;`);
            await queryRunner.query(`UPDATE \`assistant\` SET \`type\` = 'OPENAI';`);
            const assistants = await queryRunner.query(`SELECT * FROM \`assistant\`;`);
            for (let assistant of assistants) {
                const details = JSON.parse(assistant.details);
                if (!details?.id)
                    await queryRunner.query(`UPDATE \`assistant\` SET \`type\` = 'CUSTOM' WHERE id = '${assistant.id}';`);
            }
        }
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`assistant\` DROP COLUMN \`type\`;`);
    }
}
exports.FixOpenSourceAssistantTable1743758056188 = FixOpenSourceAssistantTable1743758056188;
//# sourceMappingURL=1743758056188-FixOpenSourceAssistantTable.js.map