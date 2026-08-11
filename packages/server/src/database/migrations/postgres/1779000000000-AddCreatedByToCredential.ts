import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCreatedByToCredential1779000000000 implements MigrationInterface {
    name = 'AddCreatedByToCredential1779000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Who registered the credential, going forward. Existing rows are left null — there is
        // no reliable historical owner to backfill, and CredentialAccess's backfill migration
        // (below) grants existing workspace members access regardless of createdBy.
        await queryRunner.query(`ALTER TABLE "credential" ADD COLUMN IF NOT EXISTS "createdBy" varchar;`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "credential" DROP COLUMN IF EXISTS "createdBy";`)
    }
}
