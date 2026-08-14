import { MigrationInterface, QueryRunner } from 'typeorm'
import { ensureColumnExists } from './mysqlCustomFunctions'

export class AddOrganizationAnalytic1783000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await ensureColumnExists(queryRunner, 'organization', 'analytic', 'TEXT')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `organization` DROP COLUMN `analytic`;')
    }
}
