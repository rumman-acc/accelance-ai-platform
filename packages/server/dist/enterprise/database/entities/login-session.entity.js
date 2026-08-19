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
exports.LoginSession = void 0;
const typeorm_1 = require("typeorm");
let LoginSession = class LoginSession {
};
exports.LoginSession = LoginSession;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar' }),
    __metadata("design:type", String)
], LoginSession.prototype, "sid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], LoginSession.prototype, "sess", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], LoginSession.prototype, "expire", void 0);
exports.LoginSession = LoginSession = __decorate([
    (0, typeorm_1.Entity)({ name: 'login_sessions' })
], LoginSession);
//# sourceMappingURL=login-session.entity.js.map