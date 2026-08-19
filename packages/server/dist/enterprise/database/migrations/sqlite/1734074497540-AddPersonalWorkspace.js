"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPersonalWorkspace1734074497540 = void 0;
const uuid_1 = require("uuid");
class AddPersonalWorkspace1734074497540 {
    constructor() {
        this.name = 'AddPersonalWorkspace1734074497540';
    }
    async up(queryRunner) {
        const users = await queryRunner.query(`select * from "user";`);
        const organization = await queryRunner.query(`select "id" from "organization";`);
        for (let user of users) {
            const workspaceDescription = 'Personal Workspace of ' + user.id;
            const workspaceId = (0, uuid_1.v4)();
            await queryRunner.query(`
                insert into "workspace" ("id", "name", "description", "organizationId")
                values('${workspaceId}', 'Personal Workspace', '${workspaceDescription}', '${organization[0].id}');
            `);
            const workspaceusersId = (0, uuid_1.v4)();
            await queryRunner.query(`
                insert into "workspace_users" ("id", "workspaceId", "userId", "role")
                values('${workspaceusersId}', '${workspaceId}', '${user.id}', 'pw');
            `);
        }
    }
    async down() { }
}
exports.AddPersonalWorkspace1734074497540 = AddPersonalWorkspace1734074497540;
//# sourceMappingURL=1734074497540-AddPersonalWorkspace.js.map