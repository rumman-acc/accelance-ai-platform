"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkspaceSearchOptionsFromReq = exports.getWorkspaceSearchOptions = void 0;
const typeorm_1 = require("typeorm");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const http_status_codes_1 = require("http-status-codes");
const getWorkspaceSearchOptions = (workspaceId) => {
    if (!workspaceId) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Workspace ID is required`);
    }
    return { workspaceId: (0, typeorm_1.Equal)(workspaceId) };
};
exports.getWorkspaceSearchOptions = getWorkspaceSearchOptions;
const getWorkspaceSearchOptionsFromReq = (req) => {
    const workspaceId = req.user?.activeWorkspaceId;
    if (!workspaceId) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Workspace ID is required`);
    }
    return { workspaceId: (0, typeorm_1.Equal)(workspaceId) };
};
exports.getWorkspaceSearchOptionsFromReq = getWorkspaceSearchOptionsFromReq;
//# sourceMappingURL=ControllerServiceUtils.js.map