"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const leads_1 = __importDefault(require("../../controllers/leads"));
const router = express_1.default.Router();
// CREATE
router.post('/', leads_1.default.createLeadInChatflow);
// READ
router.get(['/', '/:id'], leads_1.default.getAllLeadsForChatflow);
exports.default = router;
//# sourceMappingURL=index.js.map