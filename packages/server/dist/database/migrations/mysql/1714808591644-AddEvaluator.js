"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddEvaluator1714808591644 = void 0;
class AddEvaluator1714808591644 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`evaluator\` (
                \`id\` varchar(36) NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`type\` varchar(25) DEFAULT NULL,
                \`config\` LONGTEXT DEFAULT NULL,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE evaluator`);
    }
}
exports.AddEvaluator1714808591644 = AddEvaluator1714808591644;
//# sourceMappingURL=1714808591644-AddEvaluator.js.map