import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class RefactorEnterpriseDatabase1737076223692 implements MigrationInterface {
    name: string;
    private modifyTable;
    private deleteWorkspaceWithoutUser;
    private populateTable;
    private deleteTempTable;
    up(queryRunner: QueryRunner): Promise<void>;
    down(): Promise<void>;
}
