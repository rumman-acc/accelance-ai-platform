import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCredentialAccessEntity1780000000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS \`credential_access\` (
                \`id\` varchar(36) NOT NULL,
                \`credentialId\` varchar(36) NOT NULL,
                \`userId\` varchar(36) NOT NULL,
                \`workspaceId\` varchar(36) NOT NULL,
                \`grantedBy\` varchar(36),
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`idx_credential_access_credentialId_userId\` (\`credentialId\`, \`userId\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
        )
        await queryRunner.query(`CREATE INDEX \`idx_credential_access_userId\` ON \`credential_access\` (\`userId\`);`)

        await queryRunner.query(`
            INSERT IGNORE INTO \`credential_access\` (\`id\`, \`credentialId\`, \`userId\`, \`workspaceId\`, \`createdDate\`)
            SELECT UUID(), c.\`id\`, wu.\`userId\`, c.\`workspaceId\`, NOW()
            FROM \`credential\` c
            JOIN \`workspace_user\` wu ON wu.\`workspaceId\` = c.\`workspaceId\` AND wu.\`status\` = 'active';
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`credential_access\`;`)
    }
}
