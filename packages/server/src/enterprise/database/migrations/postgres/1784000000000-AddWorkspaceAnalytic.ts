import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddWorkspaceAnalytic1784000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace" ADD COLUMN IF NOT EXISTS "analytic" text;`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace" DROP COLUMN IF EXISTS "analytic";`)
    }
}
