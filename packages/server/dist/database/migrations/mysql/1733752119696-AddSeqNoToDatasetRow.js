"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSeqNoToDatasetRow1733752119696 = void 0;
class AddSeqNoToDatasetRow1733752119696 {
    async up(queryRunner) {
        const columnExists = await queryRunner.hasColumn('dataset_row', 'sequence_no');
        if (!columnExists)
            queryRunner.query(`ALTER TABLE \`dataset_row\` ADD COLUMN \`sequence_no\` INT  DEFAULT -1;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "dataset_row" DROP COLUMN "sequence_no";`);
    }
}
exports.AddSeqNoToDatasetRow1733752119696 = AddSeqNoToDatasetRow1733752119696;
//# sourceMappingURL=1733752119696-AddSeqNoToDatasetRow.js.map