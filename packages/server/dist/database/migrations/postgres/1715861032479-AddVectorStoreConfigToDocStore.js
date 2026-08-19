"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddVectorStoreConfigToDocStore1715861032479 = void 0;
class AddVectorStoreConfigToDocStore1715861032479 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "document_store" ADD COLUMN IF NOT EXISTS "vectorStoreConfig" TEXT;`);
        await queryRunner.query(`ALTER TABLE "document_store" ADD COLUMN IF NOT EXISTS "embeddingConfig" TEXT;`);
        await queryRunner.query(`ALTER TABLE "document_store" ADD COLUMN IF NOT EXISTS "recordManagerConfig" TEXT;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "document_store" DROP COLUMN "vectorStoreConfig";`);
        await queryRunner.query(`ALTER TABLE "document_store" DROP COLUMN "embeddingConfig";`);
        await queryRunner.query(`ALTER TABLE "document_store" DROP COLUMN "recordManagerConfig";`);
    }
}
exports.AddVectorStoreConfigToDocStore1715861032479 = AddVectorStoreConfigToDocStore1715861032479;
//# sourceMappingURL=1715861032479-AddVectorStoreConfigToDocStore.js.map