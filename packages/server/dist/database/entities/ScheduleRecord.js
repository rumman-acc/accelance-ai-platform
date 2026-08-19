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
exports.ScheduleRecord = exports.ScheduleTriggerType = void 0;
/* eslint-disable */
const typeorm_1 = require("typeorm");
var ScheduleTriggerType;
(function (ScheduleTriggerType) {
    ScheduleTriggerType["AGENTFLOW"] = "AGENTFLOW";
})(ScheduleTriggerType || (exports.ScheduleTriggerType = ScheduleTriggerType = {}));
let ScheduleRecord = class ScheduleRecord {
};
exports.ScheduleRecord = ScheduleRecord;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ScheduleRecord.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32 }),
    __metadata("design:type", String)
], ScheduleRecord.prototype, "triggerType", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], ScheduleRecord.prototype, "targetId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], ScheduleRecord.prototype, "nodeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ScheduleRecord.prototype, "cronExpression", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, default: 'UTC' }),
    __metadata("design:type", String)
], ScheduleRecord.prototype, "timezone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], ScheduleRecord.prototype, "enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], ScheduleRecord.prototype, "scheduleInputMode", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], ScheduleRecord.prototype, "defaultInput", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], ScheduleRecord.prototype, "defaultForm", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], ScheduleRecord.prototype, "lastRunAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date
    /** Optional date/time after which the schedule will no longer fire */
    )
], ScheduleRecord.prototype, "nextRunAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], ScheduleRecord.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], ScheduleRecord.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ScheduleRecord.prototype, "createdDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ScheduleRecord.prototype, "updatedDate", void 0);
exports.ScheduleRecord = ScheduleRecord = __decorate([
    (0, typeorm_1.Entity)()
], ScheduleRecord);
//# sourceMappingURL=ScheduleRecord.js.map