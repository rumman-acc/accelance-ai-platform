"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAuthTables1720230151482 = void 0;
class AddAuthTables1720230151482 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "user" (
                "id" varchar PRIMARY KEY NOT NULL, 
                "role" varchar NOT NULL, 
                "name" varchar, 
                "credential" text, 
                "tempToken" text, 
                "tokenExpiry" datetime,
                "email" varchar NOT NULL, 
                "status" varchar NOT NULL, 
                "activeWorkspaceId" varchar NOT NULL, 
                "lastLogin" datetime);`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "roles" (
                "id" varchar PRIMARY KEY NOT NULL, 
                "name" varchar, 
                "description" varchar, 
                "permissions" text);`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "login_activity" (
                "id" varchar PRIMARY KEY NOT NULL, 
                "username" varchar NOT NULL, 
                "activity_code" integer NOT NULL, 
                "message" varchar NOT NULL, 
                "attemptedDateTime" datetime NOT NULL DEFAULT (datetime('now')));`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE user`);
        await queryRunner.query(`DROP TABLE roles`);
        await queryRunner.query(`DROP TABLE login_activity`);
    }
}
exports.AddAuthTables1720230151482 = AddAuthTables1720230151482;
//# sourceMappingURL=1720230151482-AddAuthTables.js.map