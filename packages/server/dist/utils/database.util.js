"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasColumn = hasColumn;
async function hasColumn(queryRunner, tableName, columnName) {
    const table = await queryRunner.getTable(tableName);
    if (!table) {
        throw new Error(`Table ${tableName} not found`);
    }
    const hasColumn = table.columns.some((column) => column.name === columnName);
    return hasColumn;
}
//# sourceMappingURL=database.util.js.map