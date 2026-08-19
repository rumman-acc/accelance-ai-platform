"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddChatFlowNameIndex1759424923093 = void 0;
class AddChatFlowNameIndex1759424923093 {
    constructor() {
        this.name = 'AddChatFlowNameIndex1759424923093';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_chatflow_name" ON "chat_flow" (substr(name, 1, 255))`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_chatflow_name"`);
    }
}
exports.AddChatFlowNameIndex1759424923093 = AddChatFlowNameIndex1759424923093;
//# sourceMappingURL=1759424923093-AddChatFlowNameIndex.js.map