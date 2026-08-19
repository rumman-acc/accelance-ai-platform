"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMcpServerConfigToChatFlow1767000000000 = void 0;
class AddMcpServerConfigToChatFlow1767000000000 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`chat_flow\` ADD COLUMN \`mcpServerConfig\` LONGTEXT;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`chat_flow\` DROP COLUMN \`mcpServerConfig\`;`);
    }
}
exports.AddMcpServerConfigToChatFlow1767000000000 = AddMcpServerConfigToChatFlow1767000000000;
//# sourceMappingURL=1767000000000-AddMcpServerConfigToChatFlow.js.map