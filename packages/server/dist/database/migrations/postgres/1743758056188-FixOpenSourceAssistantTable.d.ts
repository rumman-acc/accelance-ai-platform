import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class FixOpenSourceAssistantTable1743758056188 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
