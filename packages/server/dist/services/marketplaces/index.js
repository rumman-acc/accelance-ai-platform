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
const fs = __importStar(require("fs"));
const http_status_codes_1 = require("http-status-codes");
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const CustomTemplate_1 = require("../../database/entities/CustomTemplate");
const workspace_service_1 = require("../../enterprise/services/workspace.service");
const ControllerServiceUtils_1 = require("../../enterprise/utils/ControllerServiceUtils");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const stripProtectedFields_1 = require("../../utils/stripProtectedFields");
const chatflows_1 = __importDefault(require("../chatflows"));
const getCategories = (fileDataObj) => {
    return Array.from(new Set(fileDataObj?.nodes?.map((node) => node.data.category).filter((category) => category)));
};
// Global marketplace templates are static JSON files on disk that only change on
// deploy — getAllTemplates was re-scanning 4 directories and re-reading every file
// on every single request. Cache in-process for the life of the server; a restart
// (which is exactly when the files on disk would change too) is the only invalidation
// this needs.
let allTemplatesCache;
// Get all templates for marketplaces
const getAllTemplates = async () => {
    if (allTemplatesCache)
        return allTemplatesCache;
    try {
        let marketplaceDir = path_1.default.join(__dirname, '..', '..', '..', 'marketplaces', 'chatflows');
        let jsonsInDir = fs.readdirSync(marketplaceDir).filter((file) => path_1.default.extname(file) === '.json');
        let templates = [];
        jsonsInDir.forEach((file) => {
            const filePath = path_1.default.join(__dirname, '..', '..', '..', 'marketplaces', 'chatflows', file);
            const fileData = fs.readFileSync(filePath);
            const fileDataObj = JSON.parse(fileData.toString());
            const template = {
                id: (0, uuid_1.v4)(),
                templateName: file.split('.json')[0],
                flowData: fileData.toString(),
                badge: fileDataObj?.badge,
                framework: fileDataObj?.framework,
                usecases: fileDataObj?.usecases,
                categories: getCategories(fileDataObj),
                type: 'Chatflow',
                description: fileDataObj?.description || ''
            };
            templates.push(template);
        });
        marketplaceDir = path_1.default.join(__dirname, '..', '..', '..', 'marketplaces', 'tools');
        jsonsInDir = fs.readdirSync(marketplaceDir).filter((file) => path_1.default.extname(file) === '.json');
        jsonsInDir.forEach((file) => {
            const filePath = path_1.default.join(__dirname, '..', '..', '..', 'marketplaces', 'tools', file);
            const fileData = fs.readFileSync(filePath);
            const fileDataObj = JSON.parse(fileData.toString());
            const template = {
                ...fileDataObj,
                id: (0, uuid_1.v4)(),
                type: 'Tool',
                framework: fileDataObj?.framework,
                badge: fileDataObj?.badge,
                usecases: fileDataObj?.usecases,
                categories: [],
                templateName: file.split('.json')[0]
            };
            templates.push(template);
        });
        /*
        * Agentflow is deprecated
        marketplaceDir = path.join(__dirname, '..', '..', '..', 'marketplaces', 'agentflows')
        jsonsInDir = fs.readdirSync(marketplaceDir).filter((file) => path.extname(file) === '.json')
        jsonsInDir.forEach((file) => {
            const filePath = path.join(__dirname, '..', '..', '..', 'marketplaces', 'agentflows', file)
            const fileData = fs.readFileSync(filePath)
            const fileDataObj = JSON.parse(fileData.toString())
            const template = {
                id: uuidv4(),
                templateName: file.split('.json')[0],
                flowData: fileData.toString(),
                badge: fileDataObj?.badge,
                framework: fileDataObj?.framework,
                usecases: fileDataObj?.usecases,
                categories: getCategories(fileDataObj),
                type: 'Agentflow',
                description: fileDataObj?.description || ''
            }
            templates.push(template)
        })*/
        marketplaceDir = path_1.default.join(__dirname, '..', '..', '..', 'marketplaces', 'agentflowsv2');
        jsonsInDir = fs.readdirSync(marketplaceDir).filter((file) => path_1.default.extname(file) === '.json');
        jsonsInDir.forEach((file) => {
            const filePath = path_1.default.join(__dirname, '..', '..', '..', 'marketplaces', 'agentflowsv2', file);
            const fileData = fs.readFileSync(filePath);
            const fileDataObj = JSON.parse(fileData.toString());
            const template = {
                id: (0, uuid_1.v4)(),
                templateName: file.split('.json')[0],
                flowData: fileData.toString(),
                badge: fileDataObj?.badge,
                framework: fileDataObj?.framework,
                usecases: fileDataObj?.usecases,
                categories: getCategories(fileDataObj),
                type: 'AgentflowV2',
                description: fileDataObj?.description || ''
            };
            templates.push(template);
        });
        const sortedTemplates = templates.sort((a, b) => {
            // Prioritize AgentflowV2 templates first
            if (a.type === 'AgentflowV2' && b.type !== 'AgentflowV2') {
                return -1;
            }
            if (b.type === 'AgentflowV2' && a.type !== 'AgentflowV2') {
                return 1;
            }
            // Put Tool templates last
            if (a.type === 'Tool' && b.type !== 'Tool') {
                return 1;
            }
            if (b.type === 'Tool' && a.type !== 'Tool') {
                return -1;
            }
            // For same types, sort alphabetically by templateName
            return a.templateName.localeCompare(b.templateName);
        });
        const dbResponse = sortedTemplates;
        allTemplatesCache = dbResponse;
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: marketplacesService.getAllTemplates - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const deleteCustomTemplate = async (templateId, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        return await appServer.AppDataSource.getRepository(CustomTemplate_1.CustomTemplate).delete({ id: templateId, workspaceId: workspaceId });
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: marketplacesService.deleteCustomTemplate - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const _modifyTemplates = (templates) => {
    templates.map((template) => {
        template.usecases = template.usecases ? JSON.parse(template.usecases) : '';
        if (template.type === 'Tool') {
            template.flowData = JSON.parse(template.flowData);
            template.iconSrc = template.flowData.iconSrc;
            template.schema = template.flowData.schema;
            template.func = template.flowData.func;
            template.categories = [];
            template.flowData = undefined;
        }
        else {
            template.categories = getCategories(JSON.parse(template.flowData));
        }
        if (!template.badge) {
            template.badge = '';
        }
        if (!template.framework) {
            template.framework = '';
        }
    });
};
const getAllCustomTemplates = async (workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const templates = await appServer.AppDataSource.getRepository(CustomTemplate_1.CustomTemplate).findBy((0, ControllerServiceUtils_1.getWorkspaceSearchOptions)(workspaceId));
        const dbResponse = [];
        _modifyTemplates(templates);
        dbResponse.push(...templates);
        // get shared credentials
        if (workspaceId) {
            const workspaceService = new workspace_service_1.WorkspaceService();
            const sharedItems = (await workspaceService.getSharedItemsForWorkspace(workspaceId, 'custom_template'));
            if (sharedItems && sharedItems.length) {
                _modifyTemplates(sharedItems);
                // add shared = true flag to all shared items, to differentiate them in the UI
                sharedItems.forEach((sharedItem) => {
                    // @ts-ignore
                    sharedItem.shared = true;
                    dbResponse.push(sharedItem);
                });
            }
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: marketplacesService.getAllCustomTemplates - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const saveCustomTemplate = async (body) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        let flowDataStr = '';
        let derivedFramework = '';
        const customTemplate = new CustomTemplate_1.CustomTemplate();
        Object.assign(customTemplate, (0, stripProtectedFields_1.stripProtectedFields)(body));
        customTemplate.workspaceId = body.workspaceId; // re-apply: set by controller from req.user
        if (body.chatflowId) {
            const chatflow = await chatflows_1.default.getChatflowById(body.chatflowId, body.workspaceId);
            const flowData = JSON.parse(chatflow.flowData);
            const { framework, exportJson } = _generateExportFlowData(flowData);
            flowDataStr = JSON.stringify(exportJson);
            customTemplate.framework = framework;
        }
        else if (body.tool) {
            const flowData = {
                iconSrc: body.tool.iconSrc,
                schema: body.tool.schema,
                func: body.tool.func
            };
            customTemplate.framework = '';
            customTemplate.type = 'Tool';
            flowDataStr = JSON.stringify(flowData);
        }
        customTemplate.framework = derivedFramework;
        if (customTemplate.usecases) {
            customTemplate.usecases = JSON.stringify(customTemplate.usecases);
        }
        const entity = appServer.AppDataSource.getRepository(CustomTemplate_1.CustomTemplate).create(customTemplate);
        entity.flowData = flowDataStr;
        const flowTemplate = await appServer.AppDataSource.getRepository(CustomTemplate_1.CustomTemplate).save(entity);
        return flowTemplate;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: marketplacesService.saveCustomTemplate - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const _generateExportFlowData = (flowData) => {
    const nodes = flowData.nodes;
    const edges = flowData.edges;
    let framework = 'Langchain';
    for (let i = 0; i < nodes.length; i += 1) {
        nodes[i].selected = false;
        const node = nodes[i];
        const newNodeData = {
            id: node.data.id,
            label: node.data.label,
            version: node.data.version,
            name: node.data.name,
            type: node.data.type,
            color: node.data.color,
            hideOutput: node.data.hideOutput,
            hideInput: node.data.hideInput,
            baseClasses: node.data.baseClasses,
            tags: node.data.tags,
            category: node.data.category,
            description: node.data.description,
            inputParams: node.data.inputParams,
            inputAnchors: node.data.inputAnchors,
            inputs: {},
            outputAnchors: node.data.outputAnchors,
            outputs: node.data.outputs,
            selected: false
        };
        if (node.data.tags && node.data.tags.length) {
            if (node.data.tags.includes('LlamaIndex')) {
                framework = 'LlamaIndex';
            }
        }
        // Remove password, file & folder
        if (node.data.inputs && Object.keys(node.data.inputs).length) {
            const nodeDataInputs = {};
            for (const input in node.data.inputs) {
                const inputParam = node.data.inputParams.find((inp) => inp.name === input);
                if (inputParam && inputParam.type === 'password')
                    continue;
                if (inputParam && inputParam.type === 'file')
                    continue;
                if (inputParam && inputParam.type === 'folder')
                    continue;
                nodeDataInputs[input] = node.data.inputs[input];
            }
            newNodeData.inputs = nodeDataInputs;
        }
        nodes[i].data = newNodeData;
    }
    const exportJson = {
        nodes,
        edges
    };
    return { exportJson, framework };
};
exports.default = {
    getAllTemplates,
    getAllCustomTemplates,
    saveCustomTemplate,
    deleteCustomTemplate
};
//# sourceMappingURL=index.js.map