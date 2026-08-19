"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceUser = exports.WorkspaceUserStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const role_entity_1 = require("./role.entity");
const workspace_entity_1 = require("./workspace.entity");
var WorkspaceUserStatus;
(function (WorkspaceUserStatus) {
    WorkspaceUserStatus["ACTIVE"] = "active";
    WorkspaceUserStatus["DISABLE"] = "disable";
    WorkspaceUserStatus["INVITED"] = "invited";
})(WorkspaceUserStatus || (exports.WorkspaceUserStatus = WorkspaceUserStatus = {}));
let WorkspaceUser = class WorkspaceUser {
};
exports.WorkspaceUser = WorkspaceUser;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], WorkspaceUser.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workspace_entity_1.Workspace, (workspace) => workspace.id),
    (0, typeorm_1.JoinColumn)({ name: 'workspaceId' }),
    __metadata("design:type", workspace_entity_1.Workspace)
], WorkspaceUser.prototype, "workspace", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], WorkspaceUser.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.id),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], WorkspaceUser.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: false }),
    __metadata("design:type", String)
], WorkspaceUser.prototype, "roleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => role_entity_1.Role, (role) => role.id),
    (0, typeorm_1.JoinColumn)({ name: 'roleId' }),
    __metadata("design:type", role_entity_1.Role)
], WorkspaceUser.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: WorkspaceUserStatus.INVITED }),
    __metadata("design:type", String)
], WorkspaceUser.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", String)
], WorkspaceUser.prototype, "lastLogin", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WorkspaceUser.prototype, "createdDate", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], WorkspaceUser.prototype, "updatedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], WorkspaceUser.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.createdWorkspaceUser),
    (0, typeorm_1.JoinColumn)({ name: 'createdBy' }),
    __metadata("design:type", user_entity_1.User)
], WorkspaceUser.prototype, "createdByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], WorkspaceUser.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.updatedByWorkspaceUser),
    (0, typeorm_1.JoinColumn)({ name: 'updatedBy' }),
    __metadata("design:type", user_entity_1.User)
], WorkspaceUser.prototype, "updatedByUser", void 0);
exports.WorkspaceUser = WorkspaceUser = __decorate([
    (0, typeorm_1.Entity)({ name: 'workspace_user' })
], WorkspaceUser);
//# sourceMappingURL=workspace-user.entity.js.map