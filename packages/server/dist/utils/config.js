"use strict";
// BEWARE: This file is an intereem solution until we have a proper config strategy
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '..', '..', '.env'), override: true });
// default config
const loggingConfig = {
    dir: process.env.LOG_PATH ?? path_1.default.join(__dirname, '..', '..', 'logs'),
    server: {
        level: process.env.LOG_LEVEL ?? 'info',
        filename: 'server.log',
        errorFilename: 'server-error.log'
    },
    express: {
        level: process.env.LOG_LEVEL ?? 'info',
        format: 'jsonl', // can't be changed currently
        filename: 'server-requests.log.jsonl' // should end with .jsonl
    }
};
exports.default = {
    logging: loggingConfig
};
//# sourceMappingURL=config.js.map