"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddDatasets1714548903384 = void 0;
class AddDatasets1714548903384 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "dataset" ("id" varchar PRIMARY KEY NOT NULL, 
                "name" text NOT NULL, 
                "description" varchar, 
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')), 
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now')));`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "dataset_row" ("id" varchar PRIMARY KEY NOT NULL, 
                "datasetId" text NOT NULL, 
                "input" text NOT NULL, 
                "output" text NOT NULL, 
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now')));`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE dataset`);
        await queryRunner.query(`DROP TABLE dataset_row`);
    }
}
exports.AddDatasets1714548903384 = AddDatasets1714548903384;
//# sourceMappingURL=1714548903384-AddDataset.js.map