"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const settings_1 = __importDefault(require("../../controllers/settings"));
const router = express_1.default.Router();
// CREATE
router.get('/', settings_1.default.getSettingsList);
exports.default = router;
//# sourceMappingURL=index.js.map