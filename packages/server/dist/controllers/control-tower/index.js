"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const control_tower_1 = __importDefault(require("../../services/control-tower"));
const getStats = async (req, res, next) => {
    try {
        const workspaceId = req.user?.activeWorkspaceId;
        const stats = await control_tower_1.default.getStats(workspaceId);
        return res.json(stats);
    }
    catch (error) {
        next(error);
    }
};
const getAgentIds = async (req, res, next) => {
    try {
        const workspaceId = req.user?.activeWorkspaceId;
        const status = req.query.status;
        const agentflowIds = await control_tower_1.default.getAgentIdsByStatus(status, workspaceId);
        return res.json({ agentflowIds });
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    getStats,
    getAgentIds
};
//# sourceMappingURL=index.js.map