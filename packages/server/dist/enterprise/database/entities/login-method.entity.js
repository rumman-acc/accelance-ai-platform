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
exports.LoginMethod = exports.LoginMethodStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const organization_entity_1 = require("./organization.entity");
var LoginMethodStatus;
(function (LoginMethodStatus) {
    LoginMethodStatus["ENABLE"] = "enable";
    LoginMethodStatus["DISABLE"] = "disable";
})(LoginMethodStatus || (exports.LoginMethodStatus = LoginMethodStatus = {}));
let LoginMethod = class LoginMethod {
};
exports.LoginMethod = LoginMethod;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LoginMethod.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], LoginMethod.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, (organization) => organization.id),
    (0, typeorm_1.JoinColumn)({ name: 'organizationId' }),
    __metadata("design:type", organization_entity_1.Organization)
], LoginMethod.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], LoginMethod.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], LoginMethod.prototype, "config", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: LoginMethodStatus.ENABLE }),
    __metadata("design:type", String)
], LoginMethod.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LoginMethod.prototype, "createdDate", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], LoginMethod.prototype, "updatedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], LoginMethod.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.createdByLoginMethod),
    (0, typeorm_1.JoinColumn)({ name: 'createdBy' }),
    __metadata("design:type", user_entity_1.User)
], LoginMethod.prototype, "createdByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], LoginMethod.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.updatedByLoginMethod),
    (0, typeorm_1.JoinColumn)({ name: 'updatedBy' }),
    __metadata("design:type", user_entity_1.User)
], LoginMethod.prototype, "updatedByUser", void 0);
exports.LoginMethod = LoginMethod = __decorate([
    (0, typeorm_1.Entity)({ name: 'login_method' })
], LoginMethod);
//# sourceMappingURL=login-method.entity.js.map