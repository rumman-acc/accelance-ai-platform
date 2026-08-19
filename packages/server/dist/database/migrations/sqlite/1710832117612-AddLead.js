"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLead1710832117612 = void 0;
class AddLead1710832117612 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "lead" ("id" varchar PRIMARY KEY NOT NULL, "chatflowid" varchar NOT NULL, "chatId" varchar NOT NULL, "name" text, "email" text, "phone" text, "createdDate" datetime NOT NULL DEFAULT (datetime('now')));`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "lead";`);
    }
}
exports.AddLead1710832117612 = AddLead1710832117612;
//# sourceMappingURL=1710832117612-AddLead.js.map