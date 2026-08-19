"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterNodeByClient = void 0;
const lodash_1 = require("lodash");
const http_status_codes_1 = require("http-status-codes");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const Interface_1 = require("../../Interface");
const utils_1 = require("../../utils");
const logger_1 = __importDefault(require("../../utils/logger"));
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_2 = require("../../errors/utils");
const constants_1 = require("../../utils/constants");
const executeCustomNodeFunction_1 = require("../../utils/executeCustomNodeFunction");
const filterNodeByClient_1 = require("./filterNodeByClient");
Object.defineProperty(exports, "filterNodeByClient", { enumerable: true, get: function () { return filterNodeByClient_1.filterNodeByClient; } });
// nodesPool.componentNodes is populated once at server startup (index.ts/commands/worker.ts)
// and never mutated afterward, so a plain in-process cache keyed by client is always correct —
// no TTL or invalidation needed, and it's faster than a Redis round-trip since the whole point
// is avoiding a ~700KB cloneDeep + re-serialize on every request.
const allNodesCache = new Map();
// Get all component nodes
const getAllNodes = async (client) => {
    try {
        const cacheKey = client ?? '__all__';
        const cached = allNodesCache.get(cacheKey);
        if (cached)
            return cached;
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = [];
        for (const nodeName in appServer.nodesPool.componentNodes) {
            const clonedNode = (0, lodash_1.cloneDeep)(appServer.nodesPool.componentNodes[nodeName]);
            dbResponse.push((0, filterNodeByClient_1.filterNodeByClient)(clonedNode, client));
        }
        allNodesCache.set(cacheKey, dbResponse);
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: nodesService.getAllNodes - ${(0, utils_2.getErrorMessage)(error)}`);
    }
};
// Get all component nodes for a specific category
const getAllNodesForCategory = async (category, client) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = [];
        for (const nodeName in appServer.nodesPool.componentNodes) {
            const componentNode = appServer.nodesPool.componentNodes[nodeName];
            if (componentNode.category === category) {
                const clonedNode = (0, lodash_1.cloneDeep)(componentNode);
                dbResponse.push((0, filterNodeByClient_1.filterNodeByClient)(clonedNode, client));
            }
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: nodesService.getAllNodesForCategory - ${(0, utils_2.getErrorMessage)(error)}`);
    }
};
// Get specific component node via name
const getNodeByName = async (nodeName, client) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        if (Object.prototype.hasOwnProperty.call(appServer.nodesPool.componentNodes, nodeName)) {
            const clonedNode = (0, lodash_1.cloneDeep)(appServer.nodesPool.componentNodes[nodeName]);
            return (0, filterNodeByClient_1.filterNodeByClient)(clonedNode, client);
        }
        else {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Node ${nodeName} not found`);
        }
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: nodesService.getAllNodes - ${(0, utils_2.getErrorMessage)(error)}`);
    }
};
// Returns specific component node icon via name
const getSingleNodeIcon = async (nodeName) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        if (Object.prototype.hasOwnProperty.call(appServer.nodesPool.componentNodes, nodeName)) {
            const nodeInstance = appServer.nodesPool.componentNodes[nodeName];
            if (nodeInstance.icon === undefined) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Node ${nodeName} icon not found`);
            }
            if (nodeInstance.icon.endsWith('.svg') || nodeInstance.icon.endsWith('.png') || nodeInstance.icon.endsWith('.jpg')) {
                const filepath = nodeInstance.icon;
                return filepath;
            }
            else {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Node ${nodeName} icon is missing icon`);
            }
        }
        else {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Node ${nodeName} not found`);
        }
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: nodesService.getSingleNodeIcon - ${(0, utils_2.getErrorMessage)(error)}`);
    }
};
const getSingleNodeAsyncOptions = async (nodeName, requestBody) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const nodeData = requestBody;
        if (Object.prototype.hasOwnProperty.call(appServer.nodesPool.componentNodes, nodeName)) {
            try {
                const nodeInstance = appServer.nodesPool.componentNodes[nodeName];
                const methodName = nodeData.loadMethod || '';
                const dbResponse = await nodeInstance.loadMethods[methodName].call(nodeInstance, nodeData, {
                    appDataSource: appServer.AppDataSource,
                    databaseEntities: utils_1.databaseEntities,
                    componentNodes: appServer.nodesPool.componentNodes,
                    previousNodes: requestBody.previousNodes,
                    currentNode: requestBody.currentNode,
                    searchOptions: requestBody.searchOptions,
                    cachePool: appServer.cachePool
                });
                return dbResponse;
            }
            catch (error) {
                return [];
            }
        }
        else {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Node ${nodeName} not found`);
        }
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: nodesService.getSingleNodeAsyncOptions - ${(0, utils_2.getErrorMessage)(error)}`);
    }
};
// execute custom function node
const executeCustomFunction = async (requestBody, workspaceId, orgId, canViewVariables) => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const executeData = {
        appDataSource: appServer.AppDataSource,
        componentNodes: appServer.nodesPool.componentNodes,
        data: requestBody,
        isExecuteCustomFunction: true,
        canViewVariables,
        orgId,
        workspaceId
    };
    if (process.env.MODE === Interface_1.MODE.QUEUE) {
        const predictionQueue = appServer.queueManager.getQueue('prediction');
        const job = await predictionQueue.addJob((0, lodash_1.omit)(executeData, constants_1.OMIT_QUEUE_JOB_DATA));
        logger_1.default.debug(`[server]: Execute Custom Function Job added to queue by ${orgId}: ${job.id}`);
        const queueEvents = predictionQueue.getQueueEvents();
        const result = await job.waitUntilFinished(queueEvents);
        if (!result) {
            throw new Error('Failed to execute custom function');
        }
        return result;
    }
    else {
        return await (0, executeCustomNodeFunction_1.executeCustomNodeFunction)(executeData);
    }
};
exports.default = {
    getAllNodes,
    getNodeByName,
    getSingleNodeIcon,
    getSingleNodeAsyncOptions,
    executeCustomFunction,
    getAllNodesForCategory
};
//# sourceMappingURL=index.js.map