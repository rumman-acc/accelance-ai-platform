"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModifyChatflowType1755066758601 = void 0;
const ChatFlow_1 = require("../../entities/ChatFlow");
class ModifyChatflowType1755066758601 {
    async up(queryRunner) {
        await queryRunner.query(`
            UPDATE "chat_flow" SET "type" = '${ChatFlow_1.EnumChatflowType.CHATFLOW}' WHERE "type" IS NULL OR "type" = '';
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_flow" ALTER COLUMN "type" SET DEFAULT '${ChatFlow_1.EnumChatflowType.CHATFLOW}';
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_flow" ALTER COLUMN "type" TYPE VARCHAR(20);
        `);
        await queryRunner.query(`
            ALTER TABLE "chat_flow" ALTER COLUMN "type" SET NOT NULL;
        `);
    }
    async down() { }
}
exports.ModifyChatflowType1755066758601 = ModifyChatflowType1755066758601;
//# sourceMappingURL=1755066758601-ModifyChatflowType.js.map