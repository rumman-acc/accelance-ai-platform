"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const composio_catalog_1 = __importDefault(require("../../controllers/composio-catalog"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
// SEARCH the Composio action catalog by keyword
router.get('/search', (0, PermissionCheck_1.checkPermission)('tools:view'), composio_catalog_1.default.searchActions);
// LIST existing connected accounts for a given app (read-only; connecting happens on app.composio.dev)
router.get('/connections', (0, PermissionCheck_1.checkPermission)('tools:view'), composio_catalog_1.default.listConnections);
// IMPORT a selected action as a first-class Tool row
router.post('/import', (0, PermissionCheck_1.checkPermission)('tools:create'), composio_catalog_1.default.importAction);
exports.default = router;
//# sourceMappingURL=index.js.map