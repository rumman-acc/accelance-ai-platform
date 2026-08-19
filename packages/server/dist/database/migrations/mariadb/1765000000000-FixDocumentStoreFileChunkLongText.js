"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixDocumentStoreFileChunkLongText1765000000000 = void 0;
class FixDocumentStoreFileChunkLongText1765000000000 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`document_store_file_chunk\` MODIFY \`pageContent\` LONGTEXT NOT NULL;`);
        await queryRunner.query(`ALTER TABLE \`document_store_file_chunk\` MODIFY \`metadata\` LONGTEXT NULL;`);
    }
    async down(queryRunner) {
        // WARNING: Reverting to TEXT may cause data loss if content exceeds the 64KB limit.
        await queryRunner.query(`ALTER TABLE \`document_store_file_chunk\` MODIFY \`pageContent\` TEXT NOT NULL;`);
        await queryRunner.query(`ALTER TABLE \`document_store_file_chunk\` MODIFY \`metadata\` TEXT NULL;`);
    }
}
exports.FixDocumentStoreFileChunkLongText1765000000000 = FixDocumentStoreFileChunkLongText1765000000000;
//# sourceMappingURL=1765000000000-FixDocumentStoreFileChunkLongText.js.map