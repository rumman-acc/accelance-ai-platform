import { MigrationInterface, QueryRunner } from 'typeorm';
/**
 * The 'content_moderation' catalog entry was seeded with the wrong node names --
 * 'openAIModeration'/'simplePromptModeration' don't exist. The real node names are
 * 'inputModerationOpenAI' and 'inputModerationSimple' (see
 * packages/components/nodes/moderation/{OpenAIModeration,SimplePromptModeration}). Without this
 * fix, the canvas-node-detection scan in guardrailsService.getSummary() could never match a
 * moderation node actually placed on a flow.
 */
export declare class FixContentModerationNodeNames1788000000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
