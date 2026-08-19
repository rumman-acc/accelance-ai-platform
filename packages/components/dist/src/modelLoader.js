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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegions = exports.getModels = exports.getModelConfigByModelName = exports.getModelsJSONPath = exports.MODEL_TYPE = void 0;
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const storageUtils_1 = require("./storageUtils");
var MODEL_TYPE;
(function (MODEL_TYPE) {
    MODEL_TYPE["CHAT"] = "chat";
    MODEL_TYPE["LLM"] = "llm";
    MODEL_TYPE["EMBEDDING"] = "embedding";
})(MODEL_TYPE || (exports.MODEL_TYPE = MODEL_TYPE = {}));
const getModelsJSONPath = () => {
    const checkModelsPaths = [path.join(__dirname, '..', 'models.json'), path.join(__dirname, '..', '..', 'models.json')];
    for (const checkPath of checkModelsPaths) {
        if (fs.existsSync(checkPath)) {
            return checkPath;
        }
    }
    return '';
};
exports.getModelsJSONPath = getModelsJSONPath;
const isValidUrl = (urlString) => {
    let url;
    try {
        url = new URL(urlString);
    }
    catch (e) {
        return false;
    }
    return url.protocol === 'http:' || url.protocol === 'https:';
};
/**
 * Load the raw model file from either a URL or a local file.
 * Resolution order: an explicit MODEL_LIST_CONFIG_JSON override, then the locally-cached list
 * kept fresh by the daily refreshModelList job (packages/server), then the bundled models.json.
 * If any of the loading fails, fallback to the bundled models.json file on disk.
 */
const getRawModelFile = async () => {
    const modelFile = process.env.MODEL_LIST_CONFIG_JSON ?? (0, storageUtils_1.getModelsCachePath)();
    try {
        if (isValidUrl(modelFile)) {
            const resp = await axios_1.default.get(modelFile);
            if (resp.status === 200 && resp.data) {
                return resp.data;
            }
            else {
                throw new Error('Error fetching model list');
            }
        }
        else if (fs.existsSync(modelFile)) {
            const models = await fs.promises.readFile(modelFile, 'utf8');
            if (models) {
                return JSON.parse(models);
            }
        }
        throw new Error('Model file does not exist or is empty');
    }
    catch (e) {
        const models = await fs.promises.readFile((0, exports.getModelsJSONPath)(), 'utf8');
        if (models) {
            return JSON.parse(models);
        }
        return {};
    }
};
const getModelConfig = async (category, name) => {
    const models = await getRawModelFile();
    const categoryModels = models[category];
    return categoryModels.find((model) => model.name === name);
};
const getModelConfigByModelName = async (category, provider, name) => {
    const models = await getRawModelFile();
    const categoryModels = models[category];
    return getSpecificModelFromCategory(categoryModels, provider, name);
};
exports.getModelConfigByModelName = getModelConfigByModelName;
const getSpecificModelFromCategory = (categoryModels, provider, name) => {
    for (const cm of categoryModels) {
        if (cm.models && cm.name.toLowerCase() === provider?.toLowerCase()) {
            for (const m of cm.models) {
                if (m.name === name) {
                    return m;
                }
            }
        }
    }
    return undefined;
};
const getModels = async (category, name) => {
    const returnData = [];
    try {
        const modelConfig = await getModelConfig(category, name);
        returnData.push(...modelConfig.models);
        return returnData;
    }
    catch (e) {
        throw new Error(`Error: getModels - ${e}`);
    }
};
exports.getModels = getModels;
const getRegions = async (category, name) => {
    const returnData = [];
    try {
        const modelConfig = await getModelConfig(category, name);
        returnData.push(...modelConfig.regions);
        return returnData;
    }
    catch (e) {
        throw new Error(`Error: getRegions - ${e}`);
    }
};
exports.getRegions = getRegions;
//# sourceMappingURL=modelLoader.js.map