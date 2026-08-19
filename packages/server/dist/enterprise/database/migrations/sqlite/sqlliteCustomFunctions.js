"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureColumnExists = void 0;
const ensureColumnExists = async (queryRunner, tableName, columnName, columnType // Accept column type as a parameter
) => {
    // Retrieve column information from the specified table
    const columns = await queryRunner.query(`PRAGMA table_info(${tableName});`);
    // Check if the specified column exists
    const columnExists = columns.some((col) => col.name === columnName);
    // Check if the specified column exists in the returned columns
    if (!columnExists) {
        // Add the column if it does not exist
        await queryRunner.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType};`);
    }
};
exports.ensureColumnExists = ensureColumnExists;
//# sourceMappingURL=sqlliteCustomFunctions.js.map