import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserIdToExecution1778000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `execution` ADD COLUMN `userId` VARCHAR(36);')
        await queryRunner.query('CREATE INDEX `idx_execution_userId` ON `execution`(`userId`);')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX `idx_execution_userId` ON `execution`;')
        await queryRunner.query('ALTER TABLE `execution` DROP COLUMN `userId`;')
    }
}
