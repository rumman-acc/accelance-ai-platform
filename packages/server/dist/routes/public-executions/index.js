"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const executions_1 = __importDefault(require("../../controllers/executions"));
const router = express_1.default.Router();
// CREATE
// READ
router.get(['/', '/:id'], executions_1.default.getPublicExecutionById);
// UPDATE
// DELETE
exports.default = router;
//# sourceMappingURL=index.js.map