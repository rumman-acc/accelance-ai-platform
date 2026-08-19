"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCustomNodeFunction = void 0;
const accelance_components_1 = require("accelance-components");
const _1 = require(".");
const internalAccelanceError_1 = require("../errors/internalAccelanceError");
const http_status_codes_1 = require("http-status-codes");
const utils_1 = require("../errors/utils");
const executeCustomNodeFunction = async ({ appDataSource, componentNodes, data, workspaceId, orgId, canViewVariables }) => {
    try {
        const body = data;
        const jsFunction = typeof body?.javascriptFunction === 'string' ? body.javascriptFunction : '';
        const matches = jsFunction.matchAll(/\$([a-zA-Z0-9_]+)/g);
        const matchesArray = Array.from(matches);
        const functionInputVariables = Object.fromEntries(matchesArray.map((g) => [g[1], undefined]));
        if (functionInputVariables && Object.keys(functionInputVariables).length) {
            for (const key in functionInputVariables) {
                if (key.includes('vars')) {
                    delete functionInputVariables[key];
                }
            }
        }
        const nodeData = { inputs: { functionInputVariables, ...body } };
        if (Object.prototype.hasOwnProperty.call(componentNodes, 'customFunction')) {
            try {
                const nodeInstanceFilePath = componentNodes['customFunction'].filePath;
                const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then(s => __importStar(require(s)));
                const newNodeInstance = new nodeModule.nodeClass();
                const options = {
                    appDataSource,
                    databaseEntities: _1.databaseEntities,
                    workspaceId,
                    orgId,
                    skipVariables: !canViewVariables
                };
                const returnData = await newNodeInstance.init(nodeData, '', options);
                const dbResponse = typeof returnData === 'string' ? (0, accelance_components_1.handleEscapeCharacters)(returnData, true) : returnData;
                return dbResponse;
            }
            catch (error) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error running custom function: ${error}`);
            }
        }
        else {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Node customFunction not found`);
        }
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: nodesService.executeCustomFunction - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.executeCustomNodeFunction = executeCustomNodeFunction;
//# sourceMappingURL=executeCustomNodeFunction.js.map