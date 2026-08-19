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
exports.Evaluation = void 0;
const typeorm_1 = require("typeorm");
let Evaluation = class Evaluation {
};
exports.Evaluation = Evaluation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Evaluation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Evaluation.prototype, "average_metrics", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Evaluation.prototype, "additionalConfig", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Evaluation.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Evaluation.prototype, "evaluationType", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Evaluation.prototype, "chatflowId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Evaluation.prototype, "chatflowName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Evaluation.prototype, "datasetId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Evaluation.prototype, "datasetName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Evaluation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Evaluation.prototype, "runDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'text' }),
    __metadata("design:type", String)
], Evaluation.prototype, "workspaceId", void 0);
exports.Evaluation = Evaluation = __decorate([
    (0, typeorm_1.Entity)()
], Evaluation);
//# sourceMappingURL=Evaluation.js.map