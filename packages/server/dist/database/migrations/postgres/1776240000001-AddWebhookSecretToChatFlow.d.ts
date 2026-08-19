import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddWebhookSecretToChatFlow1776240000001 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
