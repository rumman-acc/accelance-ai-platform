"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCustomTemplate1725629836652 = void 0;
class AddCustomTemplate1725629836652 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`custom_template\` (
                \`id\` varchar(36) NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`flowData\` text NOT NULL,
                \`description\` varchar(255) DEFAULT NULL,
                \`badge\` varchar(255) DEFAULT NULL,
                \`framework\` varchar(255) DEFAULT NULL,
                \`usecases\` varchar(255) DEFAULT NULL,
                \`type\` varchar(30) DEFAULT NULL,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE custom_template`);
    }
}
exports.AddCustomTemplate1725629836652 = AddCustomTemplate1725629836652;
//# sourceMappingURL=1725629836652-AddCustomTemplate.js.map