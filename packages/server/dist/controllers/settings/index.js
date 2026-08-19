"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const settings_1 = __importDefault(require("../../services/settings"));
const getSettingsList = async (req, res, next) => {
    try {
        const apiResponse = await settings_1.default.getSettings();
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getSettingsList
};
//# sourceMappingURL=index.js.map