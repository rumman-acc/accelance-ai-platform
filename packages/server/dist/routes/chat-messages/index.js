"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chat_messages_1 = __importDefault(require("../../controllers/chat-messages"));
const router = express_1.default.Router();
// CREATE
// NOTE: Unused route
// router.post(['/', '/:id'], chatMessageController.createChatMessage)
// READ
router.get(['/', '/:id'], chat_messages_1.default.getAllChatMessages);
// UPDATE
router.put(['/abort/', '/abort/:chatflowid/:chatid'], chat_messages_1.default.abortChatMessage);
// DELETE
router.delete(['/', '/:id'], chat_messages_1.default.removeAllChatMessages);
exports.default = router;
//# sourceMappingURL=index.js.map