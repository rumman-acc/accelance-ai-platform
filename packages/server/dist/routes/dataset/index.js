"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dataset_1 = __importDefault(require("../../controllers/dataset"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
// get all datasets
router.get('/', (0, PermissionCheck_1.checkPermission)('datasets:view'), dataset_1.default.getAllDatasets);
// get new dataset
router.get(['/set', '/set/:id'], (0, PermissionCheck_1.checkPermission)('datasets:view'), dataset_1.default.getDataset);
// Create new dataset
router.post(['/set', '/set/:id'], (0, PermissionCheck_1.checkPermission)('datasets:create'), dataset_1.default.createDataset);
// Update dataset
router.put(['/set', '/set/:id'], (0, PermissionCheck_1.checkAnyPermission)('datasets:create,datasets:update'), dataset_1.default.updateDataset);
// Delete dataset via id
router.delete(['/set', '/set/:id'], (0, PermissionCheck_1.checkPermission)('datasets:delete'), dataset_1.default.deleteDataset);
// Create new row in a given dataset
router.post(['/rows', '/rows/:id'], (0, PermissionCheck_1.checkPermission)('datasets:create'), dataset_1.default.addDatasetRow);
// Update row for a dataset
router.put(['/rows', '/rows/:id'], (0, PermissionCheck_1.checkAnyPermission)('datasets:create,datasets:update'), dataset_1.default.updateDatasetRow);
// Delete dataset row via id
router.delete(['/rows', '/rows/:id'], (0, PermissionCheck_1.checkPermission)('datasets:delete'), dataset_1.default.deleteDatasetRow);
// PATCH delete by ids
router.patch('/rows', (0, PermissionCheck_1.checkPermission)('datasets:delete'), dataset_1.default.patchDeleteRows);
// Update row for a dataset
router.post(['/reorder', '/reorder'], (0, PermissionCheck_1.checkAnyPermission)('datasets:create,datasets:update'), dataset_1.default.reorderDatasetRow);
exports.default = router;
//# sourceMappingURL=index.js.map