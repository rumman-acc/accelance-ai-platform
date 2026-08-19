"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModifyExecutionSessionIdFieldType1748450230238 = void 0;
class ModifyExecutionSessionIdFieldType1748450230238 {
    constructor() {
        this.name = 'ModifyExecutionSessionIdFieldType1748450230238';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "execution" ALTER COLUMN "sessionId" type varchar USING "sessionId"::varchar`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "execution" ALTER COLUMN "sessionId" type uuid USING "sessionId"::uuid`);
    }
}
exports.ModifyExecutionSessionIdFieldType1748450230238 = ModifyExecutionSessionIdFieldType1748450230238;
//# sourceMappingURL=1748450230238-ModifyExecutionSessionIdFieldType.js.map