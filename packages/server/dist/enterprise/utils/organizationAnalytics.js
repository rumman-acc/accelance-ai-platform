"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeAnalyticsConfig = void 0;
const parseAnalytics = (analytic) => {
    if (!analytic)
        return {};
    try {
        const parsed = JSON.parse(analytic);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    }
    catch {
        return {};
    }
};
const mergeAnalyticsConfig = (organizationAnalytic, flowAnalytic) => {
    const organizationConfig = parseAnalytics(organizationAnalytic);
    const flowConfig = parseAnalytics(flowAnalytic);
    const mergedConfig = {
        ...organizationConfig,
        ...flowConfig
    };
    return Object.keys(mergedConfig).length ? JSON.stringify(mergedConfig) : undefined;
};
exports.mergeAnalyticsConfig = mergeAnalyticsConfig;
//# sourceMappingURL=organizationAnalytics.js.map