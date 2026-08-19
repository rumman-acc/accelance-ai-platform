import { QueryRunner } from 'typeorm';
export declare function hasColumn(queryRunner: QueryRunner, tableName: string, columnName: string): Promise<boolean>;
