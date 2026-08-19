"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAuthTables1720230151482 = void 0;
class AddAuthTables1720230151482 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "user" (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" varchar,
                "role" varchar NOT NULL,
                "credential" text,
                "tempToken" text,
                "tokenExpiry" timestamp,
                "email" varchar NOT NULL,
                "status" varchar NOT NULL,
                "activeWorkspaceId" varchar,
                "lastLogin" timestamp,
                CONSTRAINT "PK_98455643dd334f54-9830ab78f9" PRIMARY KEY (id)
            );`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "roles" (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" varchar,
                "description" varchar,
                "permissions" text,
                CONSTRAINT "PK_98488643dd3554f54-9830ab78f9" PRIMARY KEY (id)
            );`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "login_activity" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "username" varchar NOT NULL, 
                "activity_code" integer NOT NULL, 
                "message" varchar NOT NULL, 
                "attemptedDateTime" timestamp NOT NULL DEFAULT now());`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE user`);
        await queryRunner.query(`DROP TABLE roles`);
        await queryRunner.query(`DROP TABLE login_history`);
    }
}
exports.AddAuthTables1720230151482 = AddAuthTables1720230151482;
//# sourceMappingURL=1720230151482-AddAuthTables.js.map