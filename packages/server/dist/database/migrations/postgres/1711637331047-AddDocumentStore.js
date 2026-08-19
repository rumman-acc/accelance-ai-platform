"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddDocumentStore1711637331047 = void 0;
class AddDocumentStore1711637331047 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS document_store (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" varchar NOT NULL,
                "description" varchar,
                "loaders" text,
                "whereUsed" text,
                "status" varchar NOT NULL,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_98495043dd774f54-9830ab78f9" PRIMARY KEY (id)
            );`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS document_store_file_chunk (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                "docId" uuid NOT NULL,
                "chunkNo" integer NOT NULL,
                "storeId" uuid NOT NULL,
                "pageContent" text,
                "metadata" text,
                CONSTRAINT "PK_90005043dd774f54-9830ab78f9" PRIMARY KEY (id)
            );`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_e76bae1780b77e56aab1h2asd4" ON document_store_file_chunk USING btree ("docId");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_e213b811b01405a42309a6a410" ON document_store_file_chunk USING btree ("storeId");`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE document_store`);
        await queryRunner.query(`DROP TABLE document_store_file_chunk`);
    }
}
exports.AddDocumentStore1711637331047 = AddDocumentStore1711637331047;
//# sourceMappingURL=1711637331047-AddDocumentStore.js.map