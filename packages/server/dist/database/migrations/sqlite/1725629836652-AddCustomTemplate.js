"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCustomTemplate1725629836652 = void 0;
class AddCustomTemplate1725629836652 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "custom_template" (
                "id" varchar PRIMARY KEY NOT NULL, 
                "name" varchar NOT NULL, 
                "flowData" text NOT NULL, 
                "description" varchar, 
                "badge" varchar, 
                "framework" varchar, 
                "usecases" varchar, 
                "type" varchar, 
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now')),
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')));`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "custom_template";`);
    }
}
exports.AddCustomTemplate1725629836652 = AddCustomTemplate1725629836652;
//# sourceMappingURL=1725629836652-AddCustomTemplate.js.map