"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = __importDefault(require("../../services/log"));
// Get logs
const getLogs = async (req, res, next) => {
    try {
        const apiResponse = await log_1.default.getLogs(req.query?.startDate, req.query?.endDate);
        res.send(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getLogs
};
//# sourceMappingURL=index.js.map