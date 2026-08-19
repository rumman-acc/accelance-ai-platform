"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddApiKey1720230151480 = void 0;
class AddApiKey1720230151480 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "apikey" ("id" varchar PRIMARY KEY NOT NULL, 
                "apiKey" varchar NOT NULL, 
                "apiSecret" varchar NOT NULL, 
                "keyName" varchar NOT NULL, 
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now')));`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "apikey";`);
    }
}
exports.AddApiKey1720230151480 = AddApiKey1720230151480;
//# sourceMappingURL=1720230151480-AddApiKey.js.map