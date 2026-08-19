"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixContentModerationNodeNames1788000000000 = void 0;
/**
 * The 'content_moderation' catalog entry was seeded with the wrong node names --
 * 'openAIModeration'/'simplePromptModeration' don't exist. The real node names are
 * 'inputModerationOpenAI' and 'inputModerationSimple' (see
 * packages/components/nodes/moderation/{OpenAIModeration,SimplePromptModeration}). Without this
 * fix, the canvas-node-detection scan in guardrailsService.getSummary() could never match a
 * moderation node actually placed on a flow.
 */
class FixContentModerationNodeNames1788000000000 {
    constructor() {
        this.name = 'FixContentModerationNodeNames1788000000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`UPDATE "guardrail_catalog_item" SET "nodeNames" = '["inputModerationOpenAI","inputModerationSimple"]' WHERE "key" = 'content_moderation';`);
    }
    async down(queryRunner) {
        await queryRunner.query(`UPDATE "guardrail_catalog_item" SET "nodeNames" = '["openAIModeration","simplePromptModeration"]' WHERE "key" = 'content_moderation';`);
    }
}
exports.FixContentModerationNodeNames1788000000000 = FixContentModerationNodeNames1788000000000;
//# sourceMappingURL=1788000000000-FixContentModerationNodeNames.js.map