"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddChatFlowNameIndex1759424809984 = void 0;
class AddChatFlowNameIndex1759424809984 {
    constructor() {
        this.name = 'AddChatFlowNameIndex1759424809984';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE INDEX \`IDX_chatflow_name\` ON \`chat_flow\` (\`name\`(191))`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX \`IDX_chatflow_name\` ON \`chat_flow\``);
    }
}
exports.AddChatFlowNameIndex1759424809984 = AddChatFlowNameIndex1759424809984;
//# sourceMappingURL=1759424809984-AddChatFlowNameIndex.js.map