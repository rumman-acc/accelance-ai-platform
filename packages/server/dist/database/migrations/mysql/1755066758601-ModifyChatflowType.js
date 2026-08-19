"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModifyChatflowType1755066758601 = void 0;
const ChatFlow_1 = require("../../entities/ChatFlow");
class ModifyChatflowType1755066758601 {
    async up(queryRunner) {
        await queryRunner.query(`
            UPDATE \`chat_flow\` SET \`type\` = '${ChatFlow_1.EnumChatflowType.CHATFLOW}' WHERE \`type\` IS NULL OR \`type\` = '';
        `);
        await queryRunner.query(`
            ALTER TABLE \`chat_flow\` MODIFY COLUMN \`type\` VARCHAR(20) NOT NULL DEFAULT '${ChatFlow_1.EnumChatflowType.CHATFLOW}';
        `);
    }
    async down() { }
}
exports.ModifyChatflowType1755066758601 = ModifyChatflowType1755066758601;
//# sourceMappingURL=1755066758601-ModifyChatflowType.js.map