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
exports.Role = exports.GeneralRole = void 0;
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
const user_entity_1 = require("./user.entity");
var GeneralRole;
(function (GeneralRole) {
    GeneralRole["OWNER"] = "owner";
    GeneralRole["MEMBER"] = "member";
    GeneralRole["PERSONAL_WORKSPACE"] = "personal workspace";
})(GeneralRole || (exports.GeneralRole = GeneralRole = {}));
let Role = class Role {
};
exports.Role = Role;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Role.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Role.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, (organization) => organization.id),
    (0, typeorm_1.JoinColumn)({ name: 'organizationId' }),
    __metadata("design:type", organization_entity_1.Organization)
], Role.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Role.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Role.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Role.prototype, "permissions", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Role.prototype, "createdDate", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Role.prototype, "updatedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Role.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.createdRoles),
    (0, typeorm_1.JoinColumn)({ name: 'createdBy' }),
    __metadata("design:type", user_entity_1.User)
], Role.prototype, "createdByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Role.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.updatedRoles),
    (0, typeorm_1.JoinColumn)({ name: 'updatedBy' }),
    __metadata("design:type", user_entity_1.User)
], Role.prototype, "updatedByUser", void 0);
exports.Role = Role = __decorate([
    (0, typeorm_1.Entity)()
], Role);
//# sourceMappingURL=role.entity.js.map