import { MigrationInterface, QueryRunner } from 'typeorm'
import { ensureColumnExists } from './sqlliteCustomFunctions'

export class AddWorkspaceAnalytic1784000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await ensureColumnExists(queryRunner, 'workspace', 'analytic', 'TEXT')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace" DROP COLUMN "analytic";`)
    }
}
