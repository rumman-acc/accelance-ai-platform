import { MigrationInterface, QueryRunner } from 'typeorm';
export declare function linkWorkspaceId(queryRunner: QueryRunner, include?: boolean): Promise<void>;
export declare class LinkWorkspaceId1729130948686 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
