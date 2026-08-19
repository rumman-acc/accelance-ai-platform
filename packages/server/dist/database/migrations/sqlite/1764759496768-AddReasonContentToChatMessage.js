"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddReasonContentToChatMessage1764759496768 = void 0;
class AddReasonContentToChatMessage1764759496768 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_message" ADD COLUMN "reasonContent" TEXT;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "reasonContent";`);
    }
}
exports.AddReasonContentToChatMessage1764759496768 = AddReasonContentToChatMessage1764759496768;
//# sourceMappingURL=1764759496768-AddReasonContentToChatMessage.js.map