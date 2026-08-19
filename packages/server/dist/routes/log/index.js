"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const log_1 = __importDefault(require("../../controllers/log"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
// READ
router.get('/', (0, PermissionCheck_1.checkAnyPermission)('logs:view'), log_1.default.getLogs);
exports.default = router;
//# sourceMappingURL=index.js.map