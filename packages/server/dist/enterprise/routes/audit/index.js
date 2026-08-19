"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const audit_1 = __importDefault(require("../../controllers/audit"));
const PermissionCheck_1 = require("../../rbac/PermissionCheck");
const router = express_1.default.Router();
router.post(['/', '/login-activity'], (0, PermissionCheck_1.checkPermission)('loginActivity:view'), audit_1.default.fetchLoginActivity);
exports.default = router;
//# sourceMappingURL=index.js.map