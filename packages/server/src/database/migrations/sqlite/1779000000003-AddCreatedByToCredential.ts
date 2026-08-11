import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCreatedByToCredential1779000000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "credential" ADD COLUMN "createdBy" varchar;`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "credential" DROP COLUMN "createdBy";`)
    }
}
