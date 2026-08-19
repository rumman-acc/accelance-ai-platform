"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamResponse = exports.checkInputs = exports.Moderation = void 0;
class Moderation {
}
exports.Moderation = Moderation;
const checkInputs = async (inputModerations, input) => {
    for (const moderation of inputModerations) {
        input = await moderation.checkForViolations(input);
    }
    return input;
};
exports.checkInputs = checkInputs;
// is this the correct location for this function?
// should we have a utils files that all node components can use?
const streamResponse = (sseStreamer, chatId, response) => {
    const result = response.split(/(\s+)/);
    result.forEach((token, index) => {
        if (index === 0) {
            sseStreamer.streamStartEvent(chatId, token);
        }
        sseStreamer.streamTokenEvent(chatId, token);
    });
    sseStreamer.streamEndEvent(chatId);
};
exports.streamResponse = streamResponse;
//# sourceMappingURL=Moderation.js.map