"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCustomTemplate1725629836652 = void 0;
class AddCustomTemplate1725629836652 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS custom_template (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" varchar NOT NULL,
                "flowData" text NOT NULL,
                "description" varchar NULL,
                "badge" varchar NULL,
                "framework" varchar NULL,
                "usecases" varchar NULL,
                "type" varchar NULL,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_3c7cea7d087ac4b91764574cdbf" PRIMARY KEY (id)
            );`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE custom_template`);
    }
}
exports.AddCustomTemplate1725629836652 = AddCustomTemplate1725629836652;
//# sourceMappingURL=1725629836652-AddCustomTemplate.js.map