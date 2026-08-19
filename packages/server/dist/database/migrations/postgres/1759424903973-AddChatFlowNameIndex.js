"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddChatFlowNameIndex1759424903973 = void 0;
class AddChatFlowNameIndex1759424903973 {
    constructor() {
        this.name = 'AddChatFlowNameIndex1759424903973';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_chatflow_name" ON "chat_flow" (substring("name" from 1 for 255))`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_chatflow_name"`);
    }
}
exports.AddChatFlowNameIndex1759424903973 = AddChatFlowNameIndex1759424903973;
//# sourceMappingURL=1759424903973-AddChatFlowNameIndex.js.map