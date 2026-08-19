"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWebhookSecretToChatFlow1776240000001 = void 0;
class AddWebhookSecretToChatFlow1776240000001 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_flow" ADD COLUMN IF NOT EXISTS "webhookSecret" TEXT;`);
        await queryRunner.query(`ALTER TABLE "chat_flow" ADD COLUMN IF NOT EXISTS "webhookSecretConfigured" BOOLEAN DEFAULT FALSE;`);
        await queryRunner.query(`UPDATE "chat_flow" SET "webhookSecretConfigured" = TRUE WHERE "webhookSecret" IS NOT NULL;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_flow" DROP COLUMN "webhookSecretConfigured";`);
        await queryRunner.query(`ALTER TABLE "chat_flow" DROP COLUMN "webhookSecret";`);
    }
}
exports.AddWebhookSecretToChatFlow1776240000001 = AddWebhookSecretToChatFlow1776240000001;
//# sourceMappingURL=1776240000001-AddWebhookSecretToChatFlow.js.map