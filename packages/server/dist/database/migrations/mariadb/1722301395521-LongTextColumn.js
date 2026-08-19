"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LongTextColumn1722301395521 = void 0;
class LongTextColumn1722301395521 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`chat_flow\` MODIFY \`flowData\` LONGTEXT;`);
        await queryRunner.query(`ALTER TABLE \`chat_message\` MODIFY \`content\` LONGTEXT;`);
        await queryRunner.query(`ALTER TABLE \`chat_message\` MODIFY \`usedTools\` LONGTEXT;`);
        await queryRunner.query(`ALTER TABLE \`document_store\` MODIFY \`loaders\` LONGTEXT;`);
        await queryRunner.query(`ALTER TABLE \`upsert_history\` MODIFY \`flowData\` LONGTEXT;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`chat_flow\` MODIFY \`flowData\` TEXT;`);
        await queryRunner.query(`ALTER TABLE \`chat_message\` MODIFY \`content\` TEXT;`);
        await queryRunner.query(`ALTER TABLE \`chat_message\` MODIFY \`usedTools\` TEXT;`);
        await queryRunner.query(`ALTER TABLE \`document_store\` MODIFY \`loaders\` TEXT;`);
        await queryRunner.query(`ALTER TABLE \`upsert_history\` MODIFY \`flowData\` TEXT;`);
    }
}
exports.LongTextColumn1722301395521 = LongTextColumn1722301395521;
//# sourceMappingURL=1722301395521-LongTextColumn.js.map