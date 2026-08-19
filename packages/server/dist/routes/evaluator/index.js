"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const evaluators_1 = __importDefault(require("../../controllers/evaluators"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
// get all datasets
router.get('/', (0, PermissionCheck_1.checkPermission)('evaluators:view'), evaluators_1.default.getAllEvaluators);
// get new dataset
router.get(['/', '/:id'], (0, PermissionCheck_1.checkPermission)('evaluators:view'), evaluators_1.default.getEvaluator);
// Create new dataset
router.post(['/', '/:id'], (0, PermissionCheck_1.checkPermission)('evaluators:create'), evaluators_1.default.createEvaluator);
// Update dataset
router.put(['/', '/:id'], (0, PermissionCheck_1.checkAnyPermission)('evaluators:create,evaluators:update'), evaluators_1.default.updateEvaluator);
// Delete dataset via id
router.delete(['/', '/:id'], (0, PermissionCheck_1.checkPermission)('evaluators:delete'), evaluators_1.default.deleteEvaluator);
exports.default = router;
//# sourceMappingURL=index.js.map