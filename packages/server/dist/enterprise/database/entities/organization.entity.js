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
exports.Organization = exports.OrganizationName = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var OrganizationName;
(function (OrganizationName) {
    OrganizationName["DEFAULT_ORGANIZATION"] = "Default Organization";
})(OrganizationName || (exports.OrganizationName = OrganizationName = {}));
let Organization = class Organization {
};
exports.Organization = Organization;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Organization.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, default: OrganizationName.DEFAULT_ORGANIZATION }),
    __metadata("design:type", String)
], Organization.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120, unique: true }),
    __metadata("design:type", String)
], Organization.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "subscriptionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Organization.prototype, "analytic", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Organization.prototype, "createdDate", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Organization.prototype, "updatedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], Organization.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.createdOrganizations),
    (0, typeorm_1.JoinColumn)({ name: 'createdBy' }),
    __metadata("design:type", user_entity_1.User)
], Organization.prototype, "createdByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], Organization.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.updatedOrganizations),
    (0, typeorm_1.JoinColumn)({ name: 'updatedBy' }),
    __metadata("design:type", user_entity_1.User)
], Organization.prototype, "updatedByUser", void 0);
exports.Organization = Organization = __decorate([
    (0, typeorm_1.Entity)()
], Organization);
//# sourceMappingURL=organization.entity.js.map