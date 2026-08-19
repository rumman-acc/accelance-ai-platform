"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const stats_1 = __importDefault(require("../../services/stats"));
const Interface_1 = require("../../Interface");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const getChatflowStats = async (req, res, next) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: statsController.getChatflowStats - id not provided!`);
        }
        const activeWorkspaceId = req.user?.activeWorkspaceId;
        if (!activeWorkspaceId) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.UNAUTHORIZED, `Error: statsController.getChatflowStats - unauthorized!`);
        }
        const chatflowid = req.params.id;
        const _chatTypes = req.query?.chatType;
        let chatTypes;
        if (_chatTypes) {
            try {
                if (Array.isArray(_chatTypes)) {
                    chatTypes = _chatTypes;
                }
                else {
                    chatTypes = JSON.parse(_chatTypes);
                }
            }
            catch (e) {
                chatTypes = [_chatTypes];
            }
        }
        const startDate = req.query?.startDate;
        const endDate = req.query?.endDate;
        let feedbackTypeFilters = req.query?.feedbackType;
        if (feedbackTypeFilters) {
            try {
                const feedbackTypeFilterArray = JSON.parse(JSON.stringify(feedbackTypeFilters));
                if (feedbackTypeFilterArray.includes(Interface_1.ChatMessageRatingType.THUMBS_UP) &&
                    feedbackTypeFilterArray.includes(Interface_1.ChatMessageRatingType.THUMBS_DOWN)) {
                    feedbackTypeFilters = [Interface_1.ChatMessageRatingType.THUMBS_UP, Interface_1.ChatMessageRatingType.THUMBS_DOWN];
                }
                else if (feedbackTypeFilterArray.includes(Interface_1.ChatMessageRatingType.THUMBS_UP)) {
                    feedbackTypeFilters = [Interface_1.ChatMessageRatingType.THUMBS_UP];
                }
                else if (feedbackTypeFilterArray.includes(Interface_1.ChatMessageRatingType.THUMBS_DOWN)) {
                    feedbackTypeFilters = [Interface_1.ChatMessageRatingType.THUMBS_DOWN];
                }
                else {
                    feedbackTypeFilters = undefined;
                }
            }
            catch (e) {
                return res.status(500).send(e);
            }
        }
        const apiResponse = await stats_1.default.getChatflowStats(chatflowid, activeWorkspaceId, chatTypes, startDate, endDate, feedbackTypeFilters);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getChatflowStats
};
//# sourceMappingURL=index.js.map