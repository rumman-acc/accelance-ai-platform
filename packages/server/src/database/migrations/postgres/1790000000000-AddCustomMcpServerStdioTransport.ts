import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCustomMcpServerStdioTransport1790000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE custom_mcp_server ALTER COLUMN "serverUrl" DROP NOT NULL;`)
        await queryRunner.query(`ALTER TABLE custom_mcp_server ADD COLUMN IF NOT EXISTS "transportType" varchar NOT NULL DEFAULT 'url';`)
        await queryRunner.query(`ALTER TABLE custom_mcp_server ADD COLUMN IF NOT EXISTS "command" varchar;`)
        await queryRunner.query(`ALTER TABLE custom_mcp_server ADD COLUMN IF NOT EXISTS "args" text;`)
        await queryRunner.query(`ALTER TABLE custom_mcp_server ADD COLUMN IF NOT EXISTS "env" text;`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE custom_mcp_server DROP COLUMN IF EXISTS "env"`)
        await queryRunner.query(`ALTER TABLE custom_mcp_server DROP COLUMN IF EXISTS "args"`)
        await queryRunner.query(`ALTER TABLE custom_mcp_server DROP COLUMN IF EXISTS "command"`)
        await queryRunner.query(`ALTER TABLE custom_mcp_server DROP COLUMN IF EXISTS "transportType"`)
        await queryRunner.query(`ALTER TABLE custom_mcp_server ALTER COLUMN "serverUrl" SET NOT NULL;`)
    }
}
