import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserIdToExecution1778000000000 implements MigrationInterface {
    name = 'AddUserIdToExecution1778000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // The triggering user's identity for a run, if any (public/API-key-triggered runs have
        // none) — no FK constraint, since this is soft attribution, not a tenant-partition
        // boundary, and shouldn't block user deletion.
        await queryRunner.query(`ALTER TABLE "execution" ADD COLUMN IF NOT EXISTS "userId" varchar;`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_execution_userId" ON "execution"("userId");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_execution_userId";`)
        await queryRunner.query(`ALTER TABLE "execution" DROP COLUMN IF EXISTS "userId";`)
    }
}
