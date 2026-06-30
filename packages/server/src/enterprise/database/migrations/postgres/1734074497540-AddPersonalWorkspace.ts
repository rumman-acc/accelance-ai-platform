import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPersonalWorkspace1734074497540 implements MigrationInterface {
    name = 'AddPersonalWorkspace1734074497540'

    public async up(_queryRunner: QueryRunner): Promise<void> {
        // NO-OP in ACCELANCE_ENGINE_MODE.
        // NestJS auth service (apps/api) creates an org + workspace for every user at
        // registration. Running this migration would create duplicate workspaces and
        // would fail anyway because the workspace INSERT omits the NOT NULL createdBy /
        // updatedBy columns that NestJS added to the shared "workspace" table.
        // Workspace provisioning is owned by apps/api — do not replicate it here.
    }

    public async down(): Promise<void> {}
}
