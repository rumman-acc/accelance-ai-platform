"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddDatasets1714548903384 = void 0;
class AddDatasets1714548903384 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS dataset (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" varchar NOT NULL,
                "description" varchar NULL,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_98419043dd804f54-9830ab99f8" PRIMARY KEY (id)
            );`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS dataset_row (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                "datasetId" varchar NOT NULL,
                "input" text NOT NULL,
                "output" text NULL,
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_98909027dd804f54-9840ab99f8" PRIMARY KEY (id)
            );`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE dataset`);
        await queryRunner.query(`DROP TABLE dataset_row`);
    }
}
exports.AddDatasets1714548903384 = AddDatasets1714548903384;
//# sourceMappingURL=1714548903384-AddDataset.js.map