"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCreatedByToCredential1779000000000 = void 0;
class AddCreatedByToCredential1779000000000 {
    constructor() {
        this.name = 'AddCreatedByToCredential1779000000000';
    }
    async up(queryRunner) {
        // Who registered the credential, going forward. Existing rows are left null — there is
        // no reliable historical owner to backfill, and CredentialAccess's backfill migration
        // (below) grants existing workspace members access regardless of createdBy.
        await queryRunner.query(`ALTER TABLE "credential" ADD COLUMN IF NOT EXISTS "createdBy" varchar;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "credential" DROP COLUMN IF EXISTS "createdBy";`);
    }
}
exports.AddCreatedByToCredential1779000000000 = AddCreatedByToCredential1779000000000;
//# sourceMappingURL=1779000000000-AddCreatedByToCredential.js.map