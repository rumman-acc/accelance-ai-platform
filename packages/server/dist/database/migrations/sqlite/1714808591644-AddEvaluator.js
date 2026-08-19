"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddEvaluator1714808591644 = void 0;
class AddEvaluator1714808591644 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "evaluator" ("id" varchar PRIMARY KEY NOT NULL, 
"name" text NOT NULL, 
"type" varchar, 
"config" text, 
"createdDate" datetime NOT NULL DEFAULT (datetime('now')), 
"updatedDate" datetime NOT NULL DEFAULT (datetime('now')));`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE evaluator`);
    }
}
exports.AddEvaluator1714808591644 = AddEvaluator1714808591644;
//# sourceMappingURL=1714808591644-AddEvaluator.js.map