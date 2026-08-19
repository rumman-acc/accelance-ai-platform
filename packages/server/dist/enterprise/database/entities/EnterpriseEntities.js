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
exports.LoginActivity = exports.WorkspaceShared = exports.WorkspaceUsers = void 0;
const typeorm_1 = require("typeorm");
let WorkspaceUsers = class WorkspaceUsers {
};
exports.WorkspaceUsers = WorkspaceUsers;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WorkspaceUsers.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], WorkspaceUsers.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], WorkspaceUsers.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], WorkspaceUsers.prototype, "role", void 0);
exports.WorkspaceUsers = WorkspaceUsers = __decorate([
    (0, typeorm_1.Entity)('workspace_users')
], WorkspaceUsers);
let WorkspaceShared = class WorkspaceShared {
};
exports.WorkspaceShared = WorkspaceShared;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WorkspaceShared.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], WorkspaceShared.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], WorkspaceShared.prototype, "sharedItemId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'itemType' }),
    __metadata("design:type", String)
], WorkspaceShared.prototype, "itemType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], WorkspaceShared.prototype, "createdDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], WorkspaceShared.prototype, "updatedDate", void 0);
exports.WorkspaceShared = WorkspaceShared = __decorate([
    (0, typeorm_1.Entity)('workspace_shared')
], WorkspaceShared);
let LoginActivity = class LoginActivity {
};
exports.LoginActivity = LoginActivity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LoginActivity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], LoginActivity.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'activity_code' }),
    __metadata("design:type", Number)
], LoginActivity.prototype, "activityCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'login_mode' }),
    __metadata("design:type", String)
], LoginActivity.prototype, "loginMode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], LoginActivity.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], LoginActivity.prototype, "attemptedDateTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], LoginActivity.prototype, "organizationId", void 0);
exports.LoginActivity = LoginActivity = __decorate([
    (0, typeorm_1.Entity)('login_activity')
], LoginActivity);
//# sourceMappingURL=EnterpriseEntities.js.map