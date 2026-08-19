"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddApiKey1720230151480 = void 0;
class AddApiKey1720230151480 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS apikey (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                "apiKey" varchar NOT NULL,
                "apiSecret" varchar NOT NULL,
                "keyName" varchar NOT NULL,
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_96109043dd704f53-9830ab78f0" PRIMARY KEY (id)
            );`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE apikey`);
    }
}
exports.AddApiKey1720230151480 = AddApiKey1720230151480;
//# sourceMappingURL=1720230151480-AddApiKey.js.map