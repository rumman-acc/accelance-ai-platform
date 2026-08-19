"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddGuardrailPolicyEntity1784000000003 = void 0;
class AddGuardrailPolicyEntity1784000000003 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "guardrail_policy" (
                "id" varchar PRIMARY KEY NOT NULL,
                "workspaceId" varchar NOT NULL,
                "chatflowId" varchar NOT NULL DEFAULT (''),
                "catalogKey" varchar NOT NULL,
                "enabled" boolean NOT NULL DEFAULT (0),
                "config" text,
                "createdBy" varchar,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "idx_guardrail_policy_scope" UNIQUE ("workspaceId", "chatflowId", "catalogKey")
            );`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "guardrail_policy";`);
    }
}
exports.AddGuardrailPolicyEntity1784000000003 = AddGuardrailPolicyEntity1784000000003;
//# sourceMappingURL=1784000000003-AddGuardrailPolicyEntity.js.map