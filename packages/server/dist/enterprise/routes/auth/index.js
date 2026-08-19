"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../controllers/auth"));
const router = express_1.default.Router();
// RBAC
router.get(['/sso-success'], auth_1.default.ssoSuccess);
router.get(['/:type', '/permissions/:type'], auth_1.default.getAllPermissions);
exports.default = router;
//# sourceMappingURL=index.js.map