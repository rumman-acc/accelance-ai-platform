"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSSOColumns1730519457880 = void 0;
const mysqlCustomFunctions_1 = require("./mysqlCustomFunctions");
class AddSSOColumns1730519457880 {
    async up(queryRunner) {
        await (0, mysqlCustomFunctions_1.ensureColumnExists)(queryRunner, 'organization', 'sso_config', 'text');
        await (0, mysqlCustomFunctions_1.ensureColumnExists)(queryRunner, 'user', 'user_type', 'varchar(10)');
        await (0, mysqlCustomFunctions_1.ensureColumnExists)(queryRunner, 'login_activity', 'login_mode', 'varchar(25)');
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "sso_config";`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "user_type";`);
        await queryRunner.query(`ALTER TABLE "login_activity" DROP COLUMN "login_mode";`);
    }
}
exports.AddSSOColumns1730519457880 = AddSSOColumns1730519457880;
//# sourceMappingURL=1730519457880-AddSSOColumns.js.map