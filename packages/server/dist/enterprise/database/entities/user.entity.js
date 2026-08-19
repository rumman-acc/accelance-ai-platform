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
exports.User = exports.UserStatus = void 0;
const typeorm_1 = require("typeorm");
const login_method_entity_1 = require("./login-method.entity");
const organization_user_entity_1 = require("./organization-user.entity");
const organization_entity_1 = require("./organization.entity");
const role_entity_1 = require("./role.entity");
const workspace_user_entity_1 = require("./workspace-user.entity");
const workspace_entity_1 = require("./workspace.entity");
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["INVITED"] = "invited";
    UserStatus["UNVERIFIED"] = "unverified";
    UserStatus["DELETED"] = "deleted";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
let User = class User {
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "credential", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, unique: true }),
    __metadata("design:type", Object)
], User.prototype, "tempToken", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "tokenExpiry", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: UserStatus.UNVERIFIED }),
    __metadata("design:type", String)
], User.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "createdDate", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "updatedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], User.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User, (user) => user.id, {}),
    (0, typeorm_1.JoinColumn)({ name: 'createdBy' }),
    __metadata("design:type", User)
], User.prototype, "createdByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], User.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User, (user) => user.id, {}),
    (0, typeorm_1.JoinColumn)({ name: 'updatedBy' }),
    __metadata("design:type", User)
], User.prototype, "updatedByUser", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => organization_entity_1.Organization, (organization) => organization.createdByUser),
    __metadata("design:type", Array)
], User.prototype, "createdOrganizations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => organization_entity_1.Organization, (organization) => organization.updatedByUser),
    __metadata("design:type", Array)
], User.prototype, "updatedOrganizations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => role_entity_1.Role, (role) => role.createdByUser),
    __metadata("design:type", Array)
], User.prototype, "createdRoles", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => role_entity_1.Role, (role) => role.updatedByUser),
    __metadata("design:type", Array)
], User.prototype, "updatedRoles", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => organization_user_entity_1.OrganizationUser, (organizationUser) => organizationUser.createdByUser),
    __metadata("design:type", Array)
], User.prototype, "createdOrganizationUser", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => organization_user_entity_1.OrganizationUser, (organizationUser) => organizationUser.updatedByUser),
    __metadata("design:type", Array)
], User.prototype, "updatedOrganizationUser", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => workspace_entity_1.Workspace, (workspace) => workspace.createdByUser),
    __metadata("design:type", Array)
], User.prototype, "createdWorkspace", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => workspace_entity_1.Workspace, (workspace) => workspace.updatedByUser),
    __metadata("design:type", Array)
], User.prototype, "updatedWorkspace", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => workspace_user_entity_1.WorkspaceUser, (workspaceUser) => workspaceUser.createdByUser),
    __metadata("design:type", Array)
], User.prototype, "createdWorkspaceUser", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => workspace_user_entity_1.WorkspaceUser, (workspaceUser) => workspaceUser.updatedByUser),
    __metadata("design:type", Array)
], User.prototype, "updatedByWorkspaceUser", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => login_method_entity_1.LoginMethod, (loginMethod) => loginMethod.createdByUser),
    __metadata("design:type", Array)
], User.prototype, "createdByLoginMethod", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => login_method_entity_1.LoginMethod, (loginMethod) => loginMethod.updatedByUser),
    __metadata("design:type", Array)
], User.prototype, "updatedByLoginMethod", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)()
], User);
//# sourceMappingURL=user.entity.js.map