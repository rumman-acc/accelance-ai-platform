"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddExecutionEntity1738090872625 = void 0;
class AddExecutionEntity1738090872625 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "execution" ("id" varchar PRIMARY KEY NOT NULL, "executionData" text NOT NULL, "action" text, "state" varchar NOT NULL, "agentflowId" varchar NOT NULL, "sessionId" varchar NOT NULL, "isPublic" boolean, "createdDate" datetime NOT NULL DEFAULT (datetime('now')), "updatedDate" datetime NOT NULL DEFAULT (datetime('now')), "stoppedDate" datetime);`);
        await queryRunner.query(`ALTER TABLE "chat_message" ADD COLUMN "executionId" varchar;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE execution`);
        await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "executionId";`);
    }
}
exports.AddExecutionEntity1738090872625 = AddExecutionEntity1738090872625;
//# sourceMappingURL=1738090872625-AddExecutionEntity.js.map