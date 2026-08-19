"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddArtifactsToChatMessage1726156258465 = void 0;
class AddArtifactsToChatMessage1726156258465 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_message" ADD COLUMN "artifacts" TEXT;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "artifacts";`);
    }
}
exports.AddArtifactsToChatMessage1726156258465 = AddArtifactsToChatMessage1726156258465;
//# sourceMappingURL=1726156258465-AddArtifactsToChatMessage.js.map