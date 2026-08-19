"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const vectors_1 = __importDefault(require("../../controllers/vectors"));
const utils_1 = require("../../utils");
const router = express_1.default.Router();
// CREATE
router.post(['/upsert/', '/upsert/:id'], (0, utils_1.getMulterStorage)().array('files'), vectors_1.default.getRateLimiterMiddleware, vectors_1.default.upsertVectorMiddleware);
router.post(['/internal-upsert/', '/internal-upsert/:id'], (0, utils_1.getMulterStorage)().array('files'), vectors_1.default.createInternalUpsert);
exports.default = router;
//# sourceMappingURL=index.js.map