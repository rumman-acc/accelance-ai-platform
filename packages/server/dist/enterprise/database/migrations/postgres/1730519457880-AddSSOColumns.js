"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSSOColumns1730519457880 = void 0;
class AddSSOColumns1730519457880 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "sso_config" text;`);
        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "user_type" varchar;`);
        await queryRunner.query(`ALTER TABLE "login_activity" ADD COLUMN IF NOT EXISTS "login_mode" varchar;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "sso_config";`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "user_type";`);
        await queryRunner.query(`ALTER TABLE "login_activity" DROP COLUMN "login_mode";`);
    }
}
exports.AddSSOColumns1730519457880 = AddSSOColumns1730519457880;
//# sourceMappingURL=1730519457880-AddSSOColumns.js.map