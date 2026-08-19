"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const predictions_1 = __importDefault(require("../../controllers/predictions"));
const utils_1 = require("../../utils");
const router = express_1.default.Router();
// NOTE: extractChatflowId function in XSS.ts extracts the chatflow ID from the prediction URL.
// It assumes the URL format is /prediction/{chatflowId}. Make sure to update the function if the URL format changes.
// CREATE
router.post(['/', '/:id'], (0, utils_1.getMulterStorage)().array('files'), predictions_1.default.getRateLimiterMiddleware, predictions_1.default.createPrediction);
exports.default = router;
//# sourceMappingURL=index.js.map