"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const webhook_1 = __importDefault(require("../../controllers/webhook"));
const router = express_1.default.Router();
// Unauthenticated at route level — API key validation happens downstream in utilBuildChatflow.
router.all('/:id', webhook_1.default.getRateLimiterMiddleware, webhook_1.default.createWebhook);
exports.default = router;
//# sourceMappingURL=index.js.map