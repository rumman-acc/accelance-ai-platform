"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pricing_1 = __importDefault(require("../../controllers/pricing"));
const router = express_1.default.Router();
// GET
router.get('/', pricing_1.default.getPricing);
exports.default = router;
//# sourceMappingURL=index.js.map