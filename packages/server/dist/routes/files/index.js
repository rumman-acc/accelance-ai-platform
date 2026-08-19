"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const files_1 = __importDefault(require("../../controllers/files"));
const router = express_1.default.Router();
// READ
router.get('/', files_1.default.getAllFiles);
// DELETE
router.delete('/', files_1.default.deleteFile);
exports.default = router;
//# sourceMappingURL=index.js.map