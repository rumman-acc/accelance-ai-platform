"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const accelance_components_1 = require("accelance-components");
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const getAllLinks = async (requestUrl, relativeLinksMethod, queryLimit) => {
    try {
        const url = decodeURIComponent(requestUrl);
        await (0, accelance_components_1.checkDenyList)(url);
        if (!relativeLinksMethod) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Please choose a Relative Links Method in Additional Parameters!`);
        }
        const limit = parseInt(queryLimit);
        if (process.env.DEBUG === 'true')
            console.info(`Start ${relativeLinksMethod}`);
        const links = relativeLinksMethod === 'webCrawl' ? await (0, accelance_components_1.webCrawl)(url, limit) : await (0, accelance_components_1.xmlScrape)(url, limit);
        if (process.env.DEBUG === 'true')
            console.info(`Finish ${relativeLinksMethod}`);
        const dbResponse = {
            status: 'OK',
            links
        };
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: fetchLinksService.getAllLinks - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    getAllLinks
};
//# sourceMappingURL=index.js.map