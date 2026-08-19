"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const text_to_speech_1 = __importDefault(require("../../controllers/text-to-speech"));
const router = express_1.default.Router();
router.post('/generate', text_to_speech_1.default.generateTextToSpeech);
router.post('/abort', text_to_speech_1.default.abortTextToSpeech);
router.get('/voices', text_to_speech_1.default.getVoices);
exports.default = router;
//# sourceMappingURL=index.js.map