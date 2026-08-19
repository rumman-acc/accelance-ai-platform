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
exports.AgentToolPolicy = exports.AgentToolPolicyEffect = void 0;
/* eslint-disable */
const typeorm_1 = require("typeorm");
var AgentToolPolicyEffect;
(function (AgentToolPolicyEffect) {
    AgentToolPolicyEffect["ALLOW"] = "allow";
    AgentToolPolicyEffect["DENY"] = "deny";
})(AgentToolPolicyEffect || (exports.AgentToolPolicyEffect = AgentToolPolicyEffect = {}));
/**
 * Least-privilege allowlist: may this agent (or the workspace by default) invoke this tool node
 * type at all? Keyed on toolNodeName (e.g. "gmail", "customMCP", "agentAsTool") -- coarse by
 * design. For composite tool nodes like AgentAsTool, this restricts whether the node type may
 * run at all, not which specific downstream target (e.g. which agentflow) it calls -- see
 * AgentToolPolicyService for the matching rule.
 */
let AgentToolPolicy = class AgentToolPolicy {
};
exports.AgentToolPolicy = AgentToolPolicy;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AgentToolPolicy.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'text' }),
    __metadata("design:type", String)
], AgentToolPolicy.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'text', default: '' }),
    __metadata("design:type", String)
], AgentToolPolicy.prototype, "chatflowId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'text' }),
    __metadata("design:type", String)
], AgentToolPolicy.prototype, "toolNodeName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'text', default: AgentToolPolicyEffect.ALLOW }),
    __metadata("design:type", String)
], AgentToolPolicy.prototype, "effect", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], AgentToolPolicy.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AgentToolPolicy.prototype, "createdDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AgentToolPolicy.prototype, "updatedDate", void 0);
exports.AgentToolPolicy = AgentToolPolicy = __decorate([
    (0, typeorm_1.Entity)({ name: 'agent_tool_policy' }),
    (0, typeorm_1.Index)(['workspaceId', 'chatflowId', 'toolNodeName'], { unique: true })
], AgentToolPolicy);
//# sourceMappingURL=AgentToolPolicy.js.map