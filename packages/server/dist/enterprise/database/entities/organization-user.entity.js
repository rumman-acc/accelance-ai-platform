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
exports.OrganizationUser = exports.OrganizationUserStatus = void 0;
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
const role_entity_1 = require("./role.entity");
const user_entity_1 = require("./user.entity");
var OrganizationUserStatus;
(function (OrganizationUserStatus) {
    OrganizationUserStatus["ACTIVE"] = "active";
    OrganizationUserStatus["DISABLE"] = "disable";
    OrganizationUserStatus["INVITED"] = "invited";
})(OrganizationUserStatus || (exports.OrganizationUserStatus = OrganizationUserStatus = {}));
let OrganizationUser = class OrganizationUser {
};
exports.OrganizationUser = OrganizationUser;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], OrganizationUser.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, (organization) => organization.id),
    (0, typeorm_1.JoinColumn)({ name: 'organizationId' }),
    __metadata("design:type", organization_entity_1.Organization)
], OrganizationUser.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], OrganizationUser.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.id),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], OrganizationUser.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: false }),
    __metadata("design:type", String)
], OrganizationUser.prototype, "roleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => role_entity_1.Role, (role) => role.id),
    (0, typeorm_1.JoinColumn)({ name: 'roleId' }),
    __metadata("design:type", role_entity_1.Role)
], OrganizationUser.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: OrganizationUserStatus.ACTIVE }),
    __metadata("design:type", String)
], OrganizationUser.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], OrganizationUser.prototype, "createdDate", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], OrganizationUser.prototype, "updatedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], OrganizationUser.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.createdOrganizationUser),
    (0, typeorm_1.JoinColumn)({ name: 'createdBy' }),
    __metadata("design:type", user_entity_1.User)
], OrganizationUser.prototype, "createdByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], OrganizationUser.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.updatedOrganizationUser),
    (0, typeorm_1.JoinColumn)({ name: 'updatedBy' }),
    __metadata("design:type", user_entity_1.User)
], OrganizationUser.prototype, "updatedByUser", void 0);
exports.OrganizationUser = OrganizationUser = __decorate([
    (0, typeorm_1.Entity)({ name: 'organization_user' })
], OrganizationUser);
//# sourceMappingURL=organization-user.entity.js.map