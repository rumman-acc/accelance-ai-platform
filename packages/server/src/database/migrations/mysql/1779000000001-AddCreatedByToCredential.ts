import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCreatedByToCredential1779000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `credential` ADD COLUMN `createdBy` VARCHAR(36);')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `credential` DROP COLUMN `createdBy`;')
    }
}
