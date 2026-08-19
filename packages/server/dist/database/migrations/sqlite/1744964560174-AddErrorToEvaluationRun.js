"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddErrorToEvaluationRun1744964560174 = void 0;
class AddErrorToEvaluationRun1744964560174 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "evaluation_run" ADD COLUMN "errors" TEXT NULL DEFAULT '[]';`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "evaluation_run" DROP COLUMN "errors";`);
    }
}
exports.AddErrorToEvaluationRun1744964560174 = AddErrorToEvaluationRun1744964560174;
//# sourceMappingURL=1744964560174-AddErrorToEvaluationRun.js.map