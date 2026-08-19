"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddEvaluator1714808591644 = void 0;
class AddEvaluator1714808591644 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS evaluator (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" varchar NOT NULL,
                "type" text NULL,
                "config" text NULL,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_90019043dd804f54-9830ab11f8" PRIMARY KEY (id)
            );`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE evaluator`);
    }
}
exports.AddEvaluator1714808591644 = AddEvaluator1714808591644;
//# sourceMappingURL=1714808591644-AddEvaluator.js.map