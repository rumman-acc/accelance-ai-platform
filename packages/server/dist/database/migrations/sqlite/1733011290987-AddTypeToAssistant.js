"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTypeToAssistant1733011290987 = void 0;
class AddTypeToAssistant1733011290987 {
    async up(queryRunner) {
        const columnExists = await queryRunner.hasColumn('assistant', 'type');
        if (!columnExists) {
            await queryRunner.query(`ALTER TABLE "assistant" ADD COLUMN "type" TEXT;`);
            await queryRunner.query(`UPDATE "assistant" SET "type" = 'OPENAI';`);
        }
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "assistant" DROP COLUMN "type";`);
    }
}
exports.AddTypeToAssistant1733011290987 = AddTypeToAssistant1733011290987;
//# sourceMappingURL=1733011290987-AddTypeToAssistant.js.map