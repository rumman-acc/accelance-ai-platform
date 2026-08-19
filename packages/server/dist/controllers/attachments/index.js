"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const attachments_1 = __importDefault(require("../../services/attachments"));
const createAttachment = async (req, res, next) => {
    try {
        const apiResponse = await attachments_1.default.createAttachment(req);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    createAttachment
};
//# sourceMappingURL=index.js.map