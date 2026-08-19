"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddLead1710832137905 = void 0;
class AddLead1710832137905 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS lead (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                "chatflowid" varchar NOT NULL,
                "chatId" varchar NOT NULL,
                "name" text,
                "email" text,
                "phone" text,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_98419043dd704f54-9830ab78f0" PRIMARY KEY (id)
            );`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE lead`);
    }
}
exports.AddLead1710832137905 = AddLead1710832137905;
//# sourceMappingURL=1710832137905-AddLead.js.map