"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const guardrails_1 = __importDefault(require("../../controllers/guardrails"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
router.get('/catalog', (0, PermissionCheck_1.checkPermission)('guardrails:view'), guardrails_1.default.listCatalog);
router.post('/catalog', (0, PermissionCheck_1.checkPermission)('guardrails:manage'), guardrails_1.default.createCustomCatalogItem);
router.get('/policy', (0, PermissionCheck_1.checkPermission)('guardrails:view'), guardrails_1.default.listPolicies);
router.post('/policy', (0, PermissionCheck_1.checkPermission)('guardrails:manage'), guardrails_1.default.upsertPolicy);
router.delete('/policy/:id', (0, PermissionCheck_1.checkPermission)('guardrails:manage'), guardrails_1.default.deletePolicy);
router.get('/summary/:chatflowId', (0, PermissionCheck_1.checkPermission)('guardrails:view'), guardrails_1.default.getSummary);
exports.default = router;
//# sourceMappingURL=index.js.map