"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const evaluations_1 = __importDefault(require("../../controllers/evaluations"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
router.get('/', (0, PermissionCheck_1.checkPermission)('evaluations:view'), evaluations_1.default.getAllEvaluations);
router.get('/:id', (0, PermissionCheck_1.checkPermission)('evaluations:view'), evaluations_1.default.getEvaluation);
router.delete('/:id', (0, PermissionCheck_1.checkPermission)('evaluations:delete'), evaluations_1.default.deleteEvaluation);
router.post('/', (0, PermissionCheck_1.checkPermission)('evaluations:create'), evaluations_1.default.createEvaluation);
router.get('/is-outdated/:id', evaluations_1.default.isOutdated);
router.post('/run-again/:id', (0, PermissionCheck_1.checkAnyPermission)('evaluations:create,evaluations:run'), evaluations_1.default.runAgain);
router.get('/versions/:id', (0, PermissionCheck_1.checkPermission)('evaluations:view'), evaluations_1.default.getVersions);
router.patch('/', (0, PermissionCheck_1.checkPermission)('evaluations:delete'), evaluations_1.default.patchDeleteEvaluations);
exports.default = router;
//# sourceMappingURL=index.js.map