"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkOrganizationId1729133111652 = void 0;
class LinkOrganizationId1729133111652 {
    constructor() {
        this.name = 'LinkOrganizationId1729133111652';
    }
    async up(queryRunner) {
        // step 1 - add index and foreign key for organizationId
        await queryRunner.query(`
            ALTER TABLE \`workspace\`
            ADD INDEX \`idx_workspace_organizationId\` (\`organizationId\`),
            ADD CONSTRAINT \`fk_workspace_organizationId\`
            FOREIGN KEY (\`organizationId\`)
            REFERENCES \`organization\`(\`id\`);
        `);
    }
    async down(queryRunner) {
        // step 1 - drop index and foreign key for organizationId
        await queryRunner.query(`
            ALTER TABLE \`workspace\`
            DROP INDEX \`idx_workspace_organizationId\`,
            DROP FOREIGN KEY \`fk_workspace_organizationId\`;
        `);
    }
}
exports.LinkOrganizationId1729133111652 = LinkOrganizationId1729133111652;
//# sourceMappingURL=1729133111652-LinkOrganizationId.js.map