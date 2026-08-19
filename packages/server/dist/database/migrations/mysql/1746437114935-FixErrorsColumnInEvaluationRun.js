"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixErrorsColumnInEvaluationRun1746437114935 = void 0;
class FixErrorsColumnInEvaluationRun1746437114935 {
    async up(queryRunner) {
        const columnExists = await queryRunner.hasColumn('evaluation_run', 'errors');
        if (!columnExists)
            queryRunner.query(`ALTER TABLE \`evaluation_run\` ADD COLUMN \`errors\` LONGTEXT NULL DEFAULT ('[]');`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "evaluation_run" DROP COLUMN "errors";`);
    }
}
exports.FixErrorsColumnInEvaluationRun1746437114935 = FixErrorsColumnInEvaluationRun1746437114935;
//# sourceMappingURL=1746437114935-FixErrorsColumnInEvaluationRun.js.map