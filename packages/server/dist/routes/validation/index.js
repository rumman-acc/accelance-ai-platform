"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validation_1 = __importDefault(require("../../controllers/validation"));
const router = express_1.default.Router();
// READ
router.get('/:id', validation_1.default.checkFlowValidation);
exports.default = router;
//# sourceMappingURL=index.js.map