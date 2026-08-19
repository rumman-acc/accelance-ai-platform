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
exports.GuardrailCatalogItem = exports.GuardrailEnforcementStatus = exports.GuardrailKind = void 0;
/* eslint-disable */
const typeorm_1 = require("typeorm");
var GuardrailKind;
(function (GuardrailKind) {
    GuardrailKind["NODE"] = "node";
    GuardrailKind["POLICY"] = "policy";
})(GuardrailKind || (exports.GuardrailKind = GuardrailKind = {}));
var GuardrailEnforcementStatus;
(function (GuardrailEnforcementStatus) {
    GuardrailEnforcementStatus["ENFORCED"] = "enforced";
    GuardrailEnforcementStatus["PLANNED"] = "planned";
})(GuardrailEnforcementStatus || (exports.GuardrailEnforcementStatus = GuardrailEnforcementStatus = {}));
/**
 * The browsable Guardrails & Compliance catalog -- standard entries are seeded by migration
 * (see the AddGuardrailCatalogItem* migrations), custom entries are created per-workspace via
 * the /guardrails/catalog route. Deliberately DB-backed rather than a hardcoded list, so new
 * standard entries can be added by seeding a row without an engineer editing packages/components
 * and redeploying -- same reasoning already applied to the MCP registry browser / Composio
 * catalog importer.
 *
 * `kind: 'node'` entries map to an existing canvas node type (e.g. Content Moderation ->
 * OpenAIModeration/SimplePromptModeration) -- draggable onto the canvas, detected by scanning a
 * chatflow's flowData for `nodeNames`. `kind: 'policy'` entries have no canvas position; they're
 * enabled/configured via GuardrailPolicy and enforced by the engine wherever relevant (see
 * utils/contentRedaction.ts for the PII-redaction chokepoint).
 *
 * `enforcementStatus: 'planned'` entries are listed for visibility only -- the catalog is honest
 * about what the runtime actually does; a 'planned' entry's policy toggle is disabled in the UI
 * rather than silently doing nothing when turned on.
 */
let GuardrailCatalogItem = class GuardrailCatalogItem {
};
exports.GuardrailCatalogItem = GuardrailCatalogItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GuardrailCatalogItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'text' }),
    __metadata("design:type", String)
], GuardrailCatalogItem.prototype, "key", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'text' }),
    __metadata("design:type", String)
], GuardrailCatalogItem.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'text' }),
    __metadata("design:type", String)
], GuardrailCatalogItem.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'text', default: GuardrailKind.POLICY }),
    __metadata("design:type", String)
], GuardrailCatalogItem.prototype, "kind", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'text', default: 'guardrail' }),
    __metadata("design:type", String)
], GuardrailCatalogItem.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], GuardrailCatalogItem.prototype, "nodeNames", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'text', default: GuardrailEnforcementStatus.PLANNED }),
    __metadata("design:type", String)
], GuardrailCatalogItem.prototype, "enforcementStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], GuardrailCatalogItem.prototype, "configSchema", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], GuardrailCatalogItem.prototype, "defaultConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], GuardrailCatalogItem.prototype, "isStandard", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], GuardrailCatalogItem.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], GuardrailCatalogItem.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], GuardrailCatalogItem.prototype, "createdDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], GuardrailCatalogItem.prototype, "updatedDate", void 0);
exports.GuardrailCatalogItem = GuardrailCatalogItem = __decorate([
    (0, typeorm_1.Entity)({ name: 'guardrail_catalog_item' }),
    (0, typeorm_1.Index)(['key'], { unique: true })
], GuardrailCatalogItem);
//# sourceMappingURL=GuardrailCatalogItem.js.map