import { MigrationInterface, QueryRunner } from 'typeorm'
import { ensureColumnExists } from './sqlliteCustomFunctions'

export class AddOrganizationAnalytic1783000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await ensureColumnExists(queryRunner, 'organization', 'analytic', 'TEXT')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "temp_organization" (
                "id" varchar PRIMARY KEY NOT NULL,
                "name" varchar(100) NOT NULL DEFAULT ('Default Organization'),
                "slug" varchar(120) NOT NULL,
                "customerId" varchar(100),
                "subscriptionId" varchar(100),
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now')),
                "createdBy" varchar NOT NULL,
                "updatedBy" varchar NOT NULL,
                UNIQUE ("slug"),
                FOREIGN KEY ("createdBy") REFERENCES "user" ("id"),
                FOREIGN KEY ("updatedBy") REFERENCES "user" ("id")
            );
        `)

        await queryRunner.query(`
            INSERT INTO "temp_organization" (
                "id",
                "name",
                "slug",
                "customerId",
                "subscriptionId",
                "createdDate",
                "updatedDate",
                "createdBy",
                "updatedBy"
            )
            SELECT
                "id",
                "name",
                "slug",
                "customerId",
                "subscriptionId",
                "createdDate",
                "updatedDate",
                "createdBy",
                "updatedBy"
            FROM "organization";
        `)

        await queryRunner.query(`DROP TABLE "organization";`)
        await queryRunner.query(`ALTER TABLE "temp_organization" RENAME TO "organization";`)
    }
}
