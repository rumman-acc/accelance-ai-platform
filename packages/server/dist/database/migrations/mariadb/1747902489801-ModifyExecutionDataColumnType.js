"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModifyExecutionDataColumnType1747902489801 = void 0;
class ModifyExecutionDataColumnType1747902489801 {
    async up(queryRunner) {
        queryRunner.query(`ALTER TABLE \`execution\` MODIFY COLUMN \`executionData\` LONGTEXT NOT NULL;`);
    }
    async down(queryRunner) {
        queryRunner.query(`ALTER TABLE \`execution\` MODIFY COLUMN \`executionData\` TEXT NOT NULL;`);
    }
}
exports.ModifyExecutionDataColumnType1747902489801 = ModifyExecutionDataColumnType1747902489801;
//# sourceMappingURL=1747902489801-ModifyExecutionDataColumnType.js.map