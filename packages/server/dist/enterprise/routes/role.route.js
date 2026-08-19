"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const role_controller_1 = require("../controllers/role.controller");
const PermissionCheck_1 = require("../rbac/PermissionCheck");
const router = express_1.default.Router();
const roleController = new role_controller_1.RoleController();
router.get('/', roleController.read);
router.post('/', (0, PermissionCheck_1.checkPermission)('roles:manage'), roleController.create);
router.put('/', (0, PermissionCheck_1.checkPermission)('roles:manage'), roleController.update);
router.delete('/', (0, PermissionCheck_1.checkPermission)('roles:manage'), roleController.delete);
exports.default = router;
//# sourceMappingURL=role.route.js.map