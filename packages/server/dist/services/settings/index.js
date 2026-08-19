"use strict";
// TODO: add settings
Object.defineProperty(exports, "__esModule", { value: true });
const Interface_1 = require("../../Interface");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const getSettings = async () => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const platformType = appServer.identityManager.getPlatformType();
        switch (platformType) {
            case Interface_1.Platform.ENTERPRISE: {
                if (!appServer.identityManager.isLicenseValid()) {
                    return {};
                }
                else {
                    return { PLATFORM_TYPE: Interface_1.Platform.ENTERPRISE };
                }
            }
            case Interface_1.Platform.CLOUD: {
                return { PLATFORM_TYPE: Interface_1.Platform.CLOUD };
            }
            default: {
                return { PLATFORM_TYPE: Interface_1.Platform.OPEN_SOURCE };
            }
        }
    }
    catch (error) {
        return {};
    }
};
exports.default = {
    getSettings
};
//# sourceMappingURL=index.js.map