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
exports.ToolCallAudit = exports.ToolCallDecision = void 0;
/* eslint-disable */
const typeorm_1 = require("typeorm");
var ToolCallDecision;
(function (ToolCallDecision) {
    ToolCallDecision["ALLOWED"] = "allowed";
    ToolCallDecision["DENIED"] = "denied";
})(ToolCallDecision || (exports.ToolCallDecision = ToolCallDecision = {}));
/**
 * One row per tool invocation attempt, written by wrapToolWithPolicy() (accelance-components'
 * toolPolicy.ts) at both enforcement chokepoints. Not linked to a specific Execution row yet --
 * that would need an executionId threaded through the options bag the same way Phase 0 threaded
 * userId; left for a follow-up rather than expanding this pass further.
 */
let ToolCallAudit = class ToolCallAudit {
};
exports.ToolCallAudit = ToolCallAudit;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ToolCallAudit.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'text' }),
    __metadata("design:type", String)
], ToolCallAudit.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'text' }),
    __metadata("design:type", String)
], ToolCallAudit.prototype, "chatflowId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], ToolCallAudit.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'text' }),
    __metadata("design:type", String)
], ToolCallAudit.prototype, "toolNodeName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], ToolCallAudit.prototype, "credentialId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'text' }),
    __metadata("design:type", String)
], ToolCallAudit.prototype, "decision", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], ToolCallAudit.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ToolCallAudit.prototype, "createdDate", void 0);
exports.ToolCallAudit = ToolCallAudit = __decorate([
    (0, typeorm_1.Entity)({ name: 'tool_call_audit' }),
    (0, typeorm_1.Index)(['workspaceId', 'chatflowId'])
], ToolCallAudit);
//# sourceMappingURL=ToolCallAudit.js.map