"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const login_method_controller_1 = require("../controllers/login-method.controller");
const PermissionCheck_1 = require("../rbac/PermissionCheck");
const router = express_1.default.Router();
const loginMethodController = new login_method_controller_1.LoginMethodController();
router.get('/', (0, PermissionCheck_1.checkPermission)('sso:manage'), loginMethodController.read);
router.get('/default', loginMethodController.defaultMethods);
router.post('/', (0, PermissionCheck_1.checkPermission)('sso:manage'), loginMethodController.create);
router.put('/', (0, PermissionCheck_1.checkPermission)('sso:manage'), loginMethodController.update);
router.post('/test', (0, PermissionCheck_1.checkPermission)('sso:manage'), loginMethodController.testConfig);
exports.default = router;
//# sourceMappingURL=login-method.route.js.map