"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPageAndLimitParams = void 0;
const internalAccelanceError_1 = require("../errors/internalAccelanceError");
const http_status_codes_1 = require("http-status-codes");
const getPageAndLimitParams = (req) => {
    // by default assume no pagination
    let page = -1;
    let limit = -1;
    if (req.query.page) {
        // if page is provided, make sure it's a positive number
        page = parseInt(req.query.page);
        if (page < 0) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: page cannot be negative!`);
        }
    }
    if (req.query.limit) {
        // if limit is provided, make sure it's a positive number
        limit = parseInt(req.query.limit);
        if (limit < 0) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PRECONDITION_FAILED, `Error: limit cannot be negative!`);
        }
    }
    return { page, limit };
};
exports.getPageAndLimitParams = getPageAndLimitParams;
//# sourceMappingURL=pagination.js.map