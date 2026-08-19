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
exports.AuditLog = void 0;
/* eslint-disable */
const typeorm_1 = require("typeorm");
/**
 * Append-only. Only written to when the 'audit_log' GuardrailPolicy is enabled for the
 * workspace (checked by services/audit-log itself, not by callers) -- covers guardrail/tool-policy
 * changes and chatflow deletion in this first pass, not every action platform-wide yet.
 */
let AuditLog = class AuditLog {
};
exports.AuditLog = AuditLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AuditLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'text' }),
    __metadata("design:type", String)
], AuditLog.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], AuditLog.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'text' }),
    __metadata("design:type", String)
], AuditLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'text' }),
    __metadata("design:type", String)
], AuditLog.prototype, "targetType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], AuditLog.prototype, "targetId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], AuditLog.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AuditLog.prototype, "createdDate", void 0);
exports.AuditLog = AuditLog = __decorate([
    (0, typeorm_1.Entity)({ name: 'audit_log' }),
    (0, typeorm_1.Index)(['workspaceId', 'createdDate'])
], AuditLog);
//# sourceMappingURL=AuditLog.js.map