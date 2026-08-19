"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixContentModerationNodeNames1788000000002 = void 0;
class FixContentModerationNodeNames1788000000002 {
    async up(queryRunner) {
        await queryRunner.query(`UPDATE \`guardrail_catalog_item\` SET \`nodeNames\` = '["inputModerationOpenAI","inputModerationSimple"]' WHERE \`key\` = 'content_moderation';`);
    }
    async down(queryRunner) {
        await queryRunner.query(`UPDATE \`guardrail_catalog_item\` SET \`nodeNames\` = '["openAIModeration","simplePromptModeration"]' WHERE \`key\` = 'content_moderation';`);
    }
}
exports.FixContentModerationNodeNames1788000000002 = FixContentModerationNodeNames1788000000002;
//# sourceMappingURL=1788000000002-FixContentModerationNodeNames.js.map