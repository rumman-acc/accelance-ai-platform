"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchCallback = dispatchCallback;
const crypto_1 = require("crypto");
const accelance_components_1 = require("accelance-components");
const logger_1 = __importDefault(require("./logger"));
// Delays in ms before each attempt: attempt 1 is immediate, attempt 2 waits 3s, attempt 3 waits 6s
const RETRY_DELAYS = [0, 3000, 6000];
function sign(body, secret) {
    return 'sha256=' + (0, crypto_1.createHmac)('sha256', secret).update(body).digest('hex');
}
async function dispatchCallback(url, payload, secret) {
    const body = JSON.stringify(payload);
    const headers = { 'Content-Type': 'application/json' };
    if (secret)
        headers['X-Flowise-Signature'] = sign(body, secret);
    for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
        if (RETRY_DELAYS[attempt] > 0) {
            await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
        }
        try {
            await (0, accelance_components_1.secureAxiosRequest)({ method: 'POST', url, data: body, headers, timeout: 10000 });
            return;
        }
        catch (err) {
            if (attempt === RETRY_DELAYS.length - 1) {
                logger_1.default.error(`[callbackDispatcher] Failed to deliver callback to ${url} after ${RETRY_DELAYS.length} attempts: ${err.message}`);
            }
        }
    }
}
//# sourceMappingURL=callbackDispatcher.js.map