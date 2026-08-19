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
exports.GuardrailPolicy = void 0;
/* eslint-disable */
const typeorm_1 = require("typeorm");
/**
 * Enable/configure state for a policy-type GuardrailCatalogItem, scoped the same way
 * AgentToolPolicy already is: chatflowId='' is the workspace-wide default, a specific chatflowId
 * overrides it for that one agent, most-specific-match-wins, and no matching row means the
 * guardrail is OFF (unlike AgentToolPolicy, which defaults permissive -- there's no "already
 * broken if this ships" risk here since nothing is enforced until an admin opts in).
 */
let GuardrailPolicy = class GuardrailPolicy {
};
exports.GuardrailPolicy = GuardrailPolicy;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GuardrailPolicy.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'text' }),
    __metadata("design:type", String)
], GuardrailPolicy.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'text', default: '' }),
    __metadata("design:type", String)
], GuardrailPolicy.prototype, "chatflowId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'text' }),
    __metadata("design:type", String)
], GuardrailPolicy.prototype, "catalogKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], GuardrailPolicy.prototype, "enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], GuardrailPolicy.prototype, "config", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], GuardrailPolicy.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], GuardrailPolicy.prototype, "createdDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], GuardrailPolicy.prototype, "updatedDate", void 0);
exports.GuardrailPolicy = GuardrailPolicy = __decorate([
    (0, typeorm_1.Entity)({ name: 'guardrail_policy' }),
    (0, typeorm_1.Index)(['workspaceId', 'chatflowId', 'catalogKey'], { unique: true })
], GuardrailPolicy);
//# sourceMappingURL=GuardrailPolicy.js.map