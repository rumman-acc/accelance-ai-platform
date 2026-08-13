import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddOrganizationAnalytic1783000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "analytic" text;`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN IF EXISTS "analytic";`)
    }
}
