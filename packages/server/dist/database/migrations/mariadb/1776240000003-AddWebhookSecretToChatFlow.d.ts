import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddWebhookSecretToChatFlow1776240000003 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
