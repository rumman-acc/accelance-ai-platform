"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const router = express_1.default.Router();
const userController = new user_controller_1.UserController();
router.get('/', userController.read);
router.get('/test', userController.test);
router.post('/', userController.create);
router.put('/', userController.update);
exports.default = router;
//# sourceMappingURL=user.route.js.map