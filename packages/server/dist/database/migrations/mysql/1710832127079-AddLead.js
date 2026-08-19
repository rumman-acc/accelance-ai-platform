"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLead1710832127079 = void 0;
class AddLead1710832127079 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`lead\` (
                \`id\` varchar(36) NOT NULL,
                \`chatflowid\` varchar(255) NOT NULL,
                \`chatId\` varchar(255) NOT NULL,
                \`name\` text,
                \`email\` text,
                \`phone\` text,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE lead`);
    }
}
exports.AddLead1710832127079 = AddLead1710832127079;
//# sourceMappingURL=1710832127079-AddLead.js.map