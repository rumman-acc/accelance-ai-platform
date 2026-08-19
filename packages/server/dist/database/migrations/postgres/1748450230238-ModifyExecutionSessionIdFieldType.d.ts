import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class ModifyExecutionSessionIdFieldType1748450230238 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
