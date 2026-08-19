"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddApiKey1720230151480 = void 0;
class AddApiKey1720230151480 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`apikey\` (
                \`id\` varchar(36) NOT NULL,
                \`apiKey\` varchar(255) NOT NULL,
                \`apiSecret\` varchar(255) NOT NULL,
                \`keyName\` varchar(255) NOT NULL,
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE apikey`);
    }
}
exports.AddApiKey1720230151480 = AddApiKey1720230151480;
//# sourceMappingURL=1720230151480-AddApiKey.js.map