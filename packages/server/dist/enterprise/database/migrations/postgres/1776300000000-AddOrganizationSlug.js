"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddOrganizationSlug1776300000000 = void 0;
class AddOrganizationSlug1776300000000 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "slug" varchar(120);`);
        await queryRunner.query(`
            WITH ranked AS (
                SELECT
                    "id",
                    COALESCE(
                        NULLIF(regexp_replace(regexp_replace(lower(trim("name")), '[^a-z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g'), ''),
                        'org'
                    ) AS "base_slug"
                FROM "organization"
                WHERE "slug" IS NULL
            ),
            numbered AS (
                SELECT
                    "id",
                    "base_slug",
                    row_number() OVER (PARTITION BY "base_slug" ORDER BY "id") AS "rn"
                FROM ranked
            )
            UPDATE "organization" o
            SET "slug" = CASE WHEN n."rn" = 1 THEN n."base_slug" ELSE n."base_slug" || '-' || n."rn" END
            FROM numbered n
            WHERE o."id" = n."id";
        `);
        await queryRunner.query(`ALTER TABLE "organization" ALTER COLUMN "slug" SET NOT NULL;`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "organization_slug_unique" ON "organization" ("slug");`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "organization_slug_unique";`);
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "slug";`);
    }
}
exports.AddOrganizationSlug1776300000000 = AddOrganizationSlug1776300000000;
//# sourceMappingURL=1776300000000-AddOrganizationSlug.js.map