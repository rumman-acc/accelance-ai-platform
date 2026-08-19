"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Server = __importStar(require("../index"));
const DataSource = __importStar(require("../DataSource"));
const logger_1 = __importDefault(require("../utils/logger"));
const base_1 = require("./base");
class Start extends base_1.BaseCommand {
    async run() {
        logger_1.default.info('Starting Accelance...');
        await DataSource.init();
        await Server.start();
    }
    async catch(error) {
        if (error.stack)
            logger_1.default.error(error.stack);
        await new Promise((resolve) => {
            setTimeout(resolve, 1000);
        });
        await this.failExit();
    }
    async stopProcess() {
        try {
            logger_1.default.info(`Shutting down Accelance...`);
            const serverApp = Server.getInstance();
            if (serverApp)
                await serverApp.stopApp();
        }
        catch (error) {
            logger_1.default.error('There was an error shutting down Accelance...', error);
            await this.failExit();
        }
        await this.gracefullyExit();
    }
}
exports.default = Start;
//# sourceMappingURL=start.js.map