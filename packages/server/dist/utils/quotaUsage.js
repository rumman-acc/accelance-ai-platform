"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkStorage = exports.updateStorageUsage = exports.checkPredictions = exports.updatePredictionsUsage = exports.checkUsageLimit = exports.getCurrentUsage = exports.ENTERPRISE_FEATURE_FLAGS = void 0;
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../errors/internalAccelanceError");
const constants_1 = require("./constants");
const logger_1 = __importDefault(require("./logger"));
exports.ENTERPRISE_FEATURE_FLAGS = [
    //'feat:account', // Only for Cloud
    'feat:datasets',
    'feat:evaluations',
    'feat:evaluators',
    'feat:files',
    'feat:login-activity',
    'feat:users',
    'feat:workspaces',
    'feat:roles',
    'feat:sso-config'
];
const getCurrentUsage = async (orgId, subscriptionId, usageCacheManager) => {
    try {
        if (!usageCacheManager || !subscriptionId || !orgId)
            return;
        const currentStorageUsage = (await usageCacheManager.get(`storage:${orgId}`)) || 0;
        const currentPredictionsUsage = (await usageCacheManager.get(`predictions:${orgId}`)) || 0;
        const quotas = await usageCacheManager.getQuotas(subscriptionId);
        const storageLimit = quotas[constants_1.LICENSE_QUOTAS.STORAGE_LIMIT];
        const predLimit = quotas[constants_1.LICENSE_QUOTAS.PREDICTIONS_LIMIT];
        return {
            predictions: {
                usage: currentPredictionsUsage,
                limit: predLimit
            },
            storage: {
                usage: currentStorageUsage,
                limit: storageLimit
            }
        };
    }
    catch (error) {
        logger_1.default.error(`[getCurrentUsage] Error getting usage: ${error}`);
        throw error;
    }
};
exports.getCurrentUsage = getCurrentUsage;
// For usage that doesn't renew per month, we just get the count from database and check
const checkUsageLimit = async (type, subscriptionId, usageCacheManager, currentUsage) => {
    if (!usageCacheManager || !subscriptionId)
        return;
    const quotas = await usageCacheManager.getQuotas(subscriptionId);
    let limit = -1;
    switch (type) {
        case 'flows':
            limit = quotas[constants_1.LICENSE_QUOTAS.FLOWS_LIMIT];
            break;
        case 'users':
            limit = quotas[constants_1.LICENSE_QUOTAS.USERS_LIMIT] + (Math.max(quotas[constants_1.LICENSE_QUOTAS.ADDITIONAL_SEATS_LIMIT], 0) || 0);
            break;
    }
    if (limit === -1)
        return;
    if (currentUsage > limit) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PAYMENT_REQUIRED, `Limit exceeded: ${type}`);
    }
};
exports.checkUsageLimit = checkUsageLimit;
// As predictions limit renew per month, we set to cache with 1 month TTL
const updatePredictionsUsage = async (orgId, subscriptionId, _ = '', usageCacheManager) => {
    if (!usageCacheManager)
        return;
    const quotas = await usageCacheManager.getQuotas(subscriptionId);
    const predictionsLimit = quotas[constants_1.LICENSE_QUOTAS.PREDICTIONS_LIMIT];
    let currentPredictions = 0;
    const existingPredictions = await usageCacheManager.get(`predictions:${orgId}`);
    if (existingPredictions) {
        currentPredictions = 1 + existingPredictions > predictionsLimit ? predictionsLimit : 1 + existingPredictions;
    }
    else {
        currentPredictions = 1;
    }
    const currentTTL = await usageCacheManager.getTTL(`predictions:${orgId}`);
    if (currentTTL) {
        const currentTimestamp = Date.now();
        const timeLeft = currentTTL - currentTimestamp;
        usageCacheManager.set(`predictions:${orgId}`, currentPredictions, timeLeft);
    }
    else {
        const subscriptionDetails = await usageCacheManager.getSubscriptionDetails(subscriptionId);
        if (subscriptionDetails && subscriptionDetails.created) {
            const MS_PER_DAY = 24 * 60 * 60 * 1000;
            const DAYS = 30;
            const approximateMonthMs = DAYS * MS_PER_DAY;
            // Calculate time elapsed since subscription creation
            const createdTimestamp = subscriptionDetails.created * 1000; // Convert to milliseconds if timestamp is in seconds
            const currentTimestamp = Date.now();
            const timeElapsed = currentTimestamp - createdTimestamp;
            // Calculate remaining time in the current month period
            const timeLeft = approximateMonthMs - (timeElapsed % approximateMonthMs);
            usageCacheManager.set(`predictions:${orgId}`, currentPredictions, timeLeft);
        }
        else {
            // Fallback to default 30 days if no creation date
            const MS_PER_DAY = 24 * 60 * 60 * 1000;
            const DAYS = 30;
            const approximateMonthMs = DAYS * MS_PER_DAY;
            usageCacheManager.set(`predictions:${orgId}`, currentPredictions, approximateMonthMs);
        }
    }
};
exports.updatePredictionsUsage = updatePredictionsUsage;
const checkPredictions = async (orgId, subscriptionId, usageCacheManager) => {
    if (!usageCacheManager || !subscriptionId)
        return;
    const currentPredictions = (await usageCacheManager.get(`predictions:${orgId}`)) || 0;
    const quotas = await usageCacheManager.getQuotas(subscriptionId);
    const predictionsLimit = quotas[constants_1.LICENSE_QUOTAS.PREDICTIONS_LIMIT];
    if (predictionsLimit === -1)
        return;
    if (currentPredictions >= predictionsLimit) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PAYMENT_REQUIRED, 'Predictions limit exceeded');
    }
    return {
        usage: currentPredictions,
        limit: predictionsLimit
    };
};
exports.checkPredictions = checkPredictions;
// Storage does not renew per month nor do we store the total size in database, so we just store the total size in cache
const updateStorageUsage = (orgId, _ = '', totalSize, usageCacheManager) => {
    if (!usageCacheManager)
        return;
    usageCacheManager.set(`storage:${orgId}`, totalSize);
};
exports.updateStorageUsage = updateStorageUsage;
const checkStorage = async (orgId, subscriptionId, usageCacheManager) => {
    if (!usageCacheManager || !subscriptionId)
        return;
    let currentStorageUsage = 0;
    currentStorageUsage = (await usageCacheManager.get(`storage:${orgId}`)) || 0;
    const quotas = await usageCacheManager.getQuotas(subscriptionId);
    const storageLimit = quotas[constants_1.LICENSE_QUOTAS.STORAGE_LIMIT];
    if (storageLimit === -1)
        return;
    if (currentStorageUsage >= storageLimit) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.PAYMENT_REQUIRED, 'Storage limit exceeded');
    }
    return {
        usage: currentStorageUsage,
        limit: storageLimit
    };
};
exports.checkStorage = checkStorage;
//# sourceMappingURL=quotaUsage.js.map