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
exports.ScheduleTriggerLog = exports.ScheduleTriggerStatus = void 0;
/* eslint-disable */
const typeorm_1 = require("typeorm");
const ScheduleRecord_1 = require("./ScheduleRecord");
var ScheduleTriggerStatus;
(function (ScheduleTriggerStatus) {
    ScheduleTriggerStatus["QUEUED"] = "QUEUED";
    ScheduleTriggerStatus["RUNNING"] = "RUNNING";
    ScheduleTriggerStatus["SUCCEEDED"] = "SUCCEEDED";
    ScheduleTriggerStatus["FAILED"] = "FAILED";
    ScheduleTriggerStatus["SKIPPED"] = "SKIPPED";
})(ScheduleTriggerStatus || (exports.ScheduleTriggerStatus = ScheduleTriggerStatus = {}));
let ScheduleTriggerLog = class ScheduleTriggerLog {
};
exports.ScheduleTriggerLog = ScheduleTriggerLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ScheduleTriggerLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], ScheduleTriggerLog.prototype, "scheduleRecordId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], ScheduleTriggerLog.prototype, "triggerType", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], ScheduleTriggerLog.prototype, "targetId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'varchar' }),
    __metadata("design:type", String)
], ScheduleTriggerLog.prototype, "executionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], ScheduleTriggerLog.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], ScheduleTriggerLog.prototype, "error", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'integer' }),
    __metadata("design:type", Number)
], ScheduleTriggerLog.prototype, "elapsedTimeMs", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], ScheduleTriggerLog.prototype, "scheduledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], ScheduleTriggerLog.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ScheduleTriggerLog.prototype, "createdDate", void 0);
exports.ScheduleTriggerLog = ScheduleTriggerLog = __decorate([
    (0, typeorm_1.Entity)()
], ScheduleTriggerLog);
//# sourceMappingURL=ScheduleTriggerLog.js.map