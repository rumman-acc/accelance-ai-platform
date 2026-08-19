"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const export_import_1 = __importDefault(require("../../controllers/export-import"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
router.post('/export', (0, PermissionCheck_1.checkPermission)('workspace:export'), export_import_1.default.exportData);
router.post('/chatflow-messages', (0, PermissionCheck_1.checkPermission)('workspace:export'), export_import_1.default.exportChatflowMessages);
router.post('/import', (0, PermissionCheck_1.checkPermission)('workspace:import'), export_import_1.default.importData);
exports.default = router;
//# sourceMappingURL=index.js.map