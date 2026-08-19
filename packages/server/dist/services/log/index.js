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
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs"));
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const readline_1 = __importDefault(require("readline"));
const readFile = (filePath) => {
    return new Promise(function (resolve, reject) {
        const lines = [];
        var rl = readline_1.default.createInterface({
            input: fs.createReadStream(filePath)
        });
        rl.on('line', (line) => {
            lines.push(line);
        });
        rl.on('close', () => {
            // Add newlines to lines
            resolve(lines.join('\n'));
        });
        rl.on('error', (error) => {
            reject(`Error reading file ${filePath}: ${error}`);
        });
    });
};
const generateDateRange = (startDate, endDate) => {
    const start = startDate.split('-');
    const end = endDate.split('-');
    const startYear = parseInt(start[0], 10);
    const startMonth = parseInt(start[1], 10) - 1; // JS months are 0-indexed
    const startDay = parseInt(start[2], 10);
    const startHour = parseInt(start[3], 10);
    const endYear = parseInt(end[0], 10);
    const endMonth = parseInt(end[1], 10) - 1;
    const endDay = parseInt(end[2], 10);
    const endHour = parseInt(end[3], 10);
    const result = [];
    const startTime = new Date(startYear, startMonth, startDay, startHour);
    const endTime = new Date(endYear, endMonth, endDay, endHour);
    for (let time = startTime; time <= endTime; time.setHours(time.getHours() + 1)) {
        const year = time.getFullYear();
        const month = (time.getMonth() + 1).toString().padStart(2, '0');
        const day = time.getDate().toString().padStart(2, '0');
        const hour = time.getHours().toString().padStart(2, '0');
        result.push(`${year}-${month}-${day}-${hour}`);
    }
    return result;
};
const getLogs = async (startDate, endDate) => {
    if (!startDate || !endDate) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: logService.getLogs - No start date or end date provided`);
    }
    if (startDate > endDate) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: logService.getLogs - Start date is greater than end date`);
    }
    try {
        var promises = [];
        const files = generateDateRange(startDate, endDate);
        for (let i = 0; i < files.length; i++) {
            const date = files[i];
            const filePath = process.env.LOG_PATH
                ? path_1.default.resolve(process.env.LOG_PATH, `server.log.${date}`)
                : path_1.default.join(__dirname, '..', '..', '..', 'logs', `server.log.${date}`);
            if (fs.existsSync(filePath)) {
                promises.push(readFile(filePath));
            }
            else {
                // console.error(`File ${filePath} not found`)
            }
            if (i === files.length - 1) {
                const results = await Promise.all(promises);
                return results;
            }
        }
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: logService.getLogs - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    getLogs
};
//# sourceMappingURL=index.js.map