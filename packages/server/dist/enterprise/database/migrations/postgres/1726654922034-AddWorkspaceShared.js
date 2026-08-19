"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddWorkspaceShared1726654922034 = void 0;
class AddWorkspaceShared1726654922034 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "workspace_shared" (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                "workspaceId" varchar NOT NULL,
                "sharedItemId" varchar NOT NULL,
                "itemType" varchar NOT NULL,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_90016043dd804f55-9830ab97f8" PRIMARY KEY (id)
            );`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE workspace_shared`);
    }
}
exports.AddWorkspaceShared1726654922034 = AddWorkspaceShared1726654922034;
//# sourceMappingURL=1726654922034-AddWorkspaceShared.js.map