"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddGuardrailPolicyEntity1784000000000 = void 0;
class AddGuardrailPolicyEntity1784000000000 {
    constructor() {
        this.name = 'AddGuardrailPolicyEntity1784000000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "guardrail_policy" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "workspaceId" text NOT NULL,
                "chatflowId" text NOT NULL DEFAULT '',
                "catalogKey" text NOT NULL,
                "enabled" boolean NOT NULL DEFAULT false,
                "config" text,
                "createdBy" text,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_guardrail_policy_id" PRIMARY KEY ("id")
            );`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_guardrail_policy_scope" ON "guardrail_policy"("workspaceId", "chatflowId", "catalogKey");`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "guardrail_policy";`);
    }
}
exports.AddGuardrailPolicyEntity1784000000000 = AddGuardrailPolicyEntity1784000000000;
//# sourceMappingURL=1784000000000-AddGuardrailPolicyEntity.js.map