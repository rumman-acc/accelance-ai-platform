"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const nodes_1 = __importDefault(require("../../controllers/nodes"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const router = express_1.default.Router();
// CREATE
// READ
router.post('/', (0, PermissionCheck_1.checkAnyPermission)('chatflows:create,chatflows:update,agentflows:create,agentflows:update'), nodes_1.default.executeCustomFunction);
// UPDATE
// DELETE
exports.default = router;
//# sourceMappingURL=index.js.map