"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAgentReasoningToChatMessage1714679514451 = void 0;
class AddAgentReasoningToChatMessage1714679514451 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_message" ADD COLUMN "agentReasoning" TEXT;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "agentReasoning";`);
    }
}
exports.AddAgentReasoningToChatMessage1714679514451 = AddAgentReasoningToChatMessage1714679514451;
//# sourceMappingURL=1714679514451-AddAgentReasoningToChatMessage.js.map