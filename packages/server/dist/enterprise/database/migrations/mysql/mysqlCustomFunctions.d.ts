import { QueryRunner } from 'typeorm';
export declare const ensureColumnExists: (queryRunner: QueryRunner, tableName: string, columnName: string, columnType: string) => Promise<void>;
