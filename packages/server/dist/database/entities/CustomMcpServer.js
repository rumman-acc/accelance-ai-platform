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
exports.CustomMcpServer = void 0;
/* eslint-disable */
const typeorm_1 = require("typeorm");
let CustomMcpServer = class CustomMcpServer {
};
exports.CustomMcpServer = CustomMcpServer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CustomMcpServer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomMcpServer.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], CustomMcpServer.prototype, "serverUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'url' }),
    __metadata("design:type", String)
], CustomMcpServer.prototype, "transportType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomMcpServer.prototype, "command", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], CustomMcpServer.prototype, "args", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], CustomMcpServer.prototype, "env", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomMcpServer.prototype, "iconSrc", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomMcpServer.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'NONE' }),
    __metadata("design:type", String)
], CustomMcpServer.prototype, "authType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], CustomMcpServer.prototype, "authConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text', select: false }),
    __metadata("design:type", String)
], CustomMcpServer.prototype, "tools", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CustomMcpServer.prototype, "toolCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'PENDING' }),
    __metadata("design:type", String)
], CustomMcpServer.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CustomMcpServer.prototype, "createdDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CustomMcpServer.prototype, "updatedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, type: 'text' }),
    __metadata("design:type", String)
], CustomMcpServer.prototype, "workspaceId", void 0);
exports.CustomMcpServer = CustomMcpServer = __decorate([
    (0, typeorm_1.Entity)()
], CustomMcpServer);
//# sourceMappingURL=CustomMcpServer.js.map