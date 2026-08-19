"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../../errors/internalAccelanceError");
const audit_1 = __importDefault(require("../../services/audit"));
const tenantRequestGuards_1 = require("../../utils/tenantRequestGuards");
const fetchLoginActivity = async (req, res, next) => {
    try {
        if (typeof req.body === 'undefined') {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: auditService.fetchLoginHistory - body not provided!`);
        }
        const user = (0, tenantRequestGuards_1.getLoggedInUser)(req);
        const apiResponse = await audit_1.default.fetchLoginActivity(req.body, user.activeOrganizationId);
        return res.json(apiResponse);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    fetchLoginActivity
};
//# sourceMappingURL=index.js.map