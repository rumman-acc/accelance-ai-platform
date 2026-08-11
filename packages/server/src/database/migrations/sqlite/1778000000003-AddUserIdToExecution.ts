import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserIdToExecution1778000000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "execution" ADD COLUMN "userId" varchar;`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_execution_userId" ON "execution"("userId");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_execution_userId";`)
        await queryRunner.query(`ALTER TABLE "execution" DROP COLUMN "userId";`)
    }
}
