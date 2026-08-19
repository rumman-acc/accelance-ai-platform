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
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs"));
const accelance_components_1 = require("accelance-components");
const v3_1 = require("zod/v3");
const prompt_1 = require("./prompt");
const utils_2 = require("../../utils");
const logger_1 = __importDefault(require("../../utils/logger"));
const Interface_1 = require("../../Interface");
// Define the Zod schema for Agentflowv2 data structure
const NodeType = v3_1.z.object({
    id: v3_1.z.string(),
    type: v3_1.z.string(),
    position: v3_1.z.object({
        x: v3_1.z.number(),
        y: v3_1.z.number()
    }),
    width: v3_1.z.number(),
    height: v3_1.z.number(),
    selected: v3_1.z.boolean().optional(),
    positionAbsolute: v3_1.z
        .object({
        x: v3_1.z.number(),
        y: v3_1.z.number()
    })
        .optional(),
    dragging: v3_1.z.boolean().optional(),
    data: v3_1.z.any().optional(),
    parentNode: v3_1.z.string().optional()
});
const EdgeType = v3_1.z.object({
    source: v3_1.z.string(),
    sourceHandle: v3_1.z.string(),
    target: v3_1.z.string(),
    targetHandle: v3_1.z.string(),
    data: v3_1.z
        .object({
        sourceColor: v3_1.z.string().optional(),
        targetColor: v3_1.z.string().optional(),
        edgeLabel: v3_1.z.string().optional(),
        isHumanInput: v3_1.z.boolean().optional()
    })
        .optional(),
    type: v3_1.z.string().optional(),
    id: v3_1.z.string()
});
const AgentFlowV2Type = v3_1.z
    .object({
    description: v3_1.z.string().optional(),
    usecases: v3_1.z.array(v3_1.z.string()).optional(),
    nodes: v3_1.z.array(NodeType),
    edges: v3_1.z.array(EdgeType),
    // Deterministic post-generation checks (e.g. a write-capable tool reachable without a
    // HITL gate) surfaced to the caller so the UI can warn before the flow is deployed --
    // see validateGeneratedFlow in accelance-components.
    warnings: v3_1.z.array(v3_1.z.string()).optional()
})
    .describe('Generate Agentflowv2 nodes and edges');
const getAllAgentFlow2Nodes = async () => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const nodes = appServer.nodesPool.componentNodes;
    const agentFlow2Nodes = [];
    for (const node in nodes) {
        if (nodes[node].category === 'Agent Flows') {
            agentFlow2Nodes.push({
                name: nodes[node].name,
                label: nodes[node].label,
                description: nodes[node].description
            });
        }
    }
    return JSON.stringify(agentFlow2Nodes, null, 2);
};
const getAllToolNodes = async () => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const nodes = appServer.nodesPool.componentNodes;
    const toolNodes = [];
    const disabled_nodes = process.env.DISABLED_NODES ? process.env.DISABLED_NODES.split(',') : [];
    const removeTools = ['chainTool', 'retrieverTool', 'webBrowser', ...disabled_nodes];
    for (const node in nodes) {
        if (nodes[node].category.includes('Tools')) {
            if (removeTools.includes(nodes[node].name)) {
                continue;
            }
            toolNodes.push({
                name: nodes[node].name,
                description: nodes[node].description
            });
        }
    }
    return JSON.stringify(toolNodes, null, 2);
};
/**
 * Which of the platform's tool nodes expose at least one send/delete/create/modify-style
 * action, per the naming-convention classifier in accelance-components. Used to tell the
 * generator's safety rule which tools need a HITL gate before a mutating call -- see
 * isWriteCapableToolNode's own doc comment for why this is a heuristic, not structured data.
 */
const getWriteCapableToolNames = async () => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const nodes = appServer.nodesPool.componentNodes;
    const writeCapable = [];
    for (const node in nodes) {
        if (nodes[node].category.includes('Tools') && (0, accelance_components_1.isWriteCapableToolNode)(nodes[node])) {
            writeCapable.push(nodes[node].name);
        }
    }
    return JSON.stringify(writeCapable, null, 2);
};
const getAllAgentflowv2Marketplaces = async () => {
    const templates = [];
    let marketplaceDir = path_1.default.join(__dirname, '..', '..', '..', 'marketplaces', 'agentflowsv2');
    let jsonsInDir = fs.readdirSync(marketplaceDir).filter((file) => path_1.default.extname(file) === '.json');
    jsonsInDir.forEach((file) => {
        try {
            const filePath = path_1.default.join(__dirname, '..', '..', '..', 'marketplaces', 'agentflowsv2', file);
            const fileData = fs.readFileSync(filePath);
            const fileDataObj = JSON.parse(fileData.toString());
            // get rid of the node.data, remain all other properties
            const filteredNodes = fileDataObj.nodes.map((node) => {
                return {
                    ...node,
                    data: undefined
                };
            });
            const title = file.split('.json')[0];
            const template = {
                title,
                description: fileDataObj.description || `Template from ${file}`,
                usecases: fileDataObj.usecases || [],
                nodes: filteredNodes,
                edges: fileDataObj.edges
            };
            // Validate template against schema
            const validatedTemplate = AgentFlowV2Type.parse(template);
            templates.push({
                ...validatedTemplate,
                // @ts-ignore
                title: title
            });
        }
        catch (error) {
            console.error(`Error processing template file ${file}:`, error);
            // Continue with next file instead of failing completely
        }
    });
    // Format templates into the requested string format
    let formattedTemplates = '';
    templates.forEach((template, index) => {
        formattedTemplates += `Example ${index + 1}: <<${template.title}>> - ${template.description}\n`;
        formattedTemplates += `"nodes": [\n`;
        // Format nodes with proper indentation
        const nodesJson = JSON.stringify(template.nodes, null, 3);
        // Split by newlines and add 3 spaces to the beginning of each line except the first and last
        const nodesLines = nodesJson.split('\n');
        if (nodesLines.length > 2) {
            formattedTemplates += `   ${nodesLines[0]}\n`;
            for (let i = 1; i < nodesLines.length - 1; i++) {
                formattedTemplates += `   ${nodesLines[i]}\n`;
            }
            formattedTemplates += `   ${nodesLines[nodesLines.length - 1]}\n`;
        }
        else {
            formattedTemplates += `   ${nodesJson}\n`;
        }
        formattedTemplates += `]\n`;
        formattedTemplates += `"edges": [\n`;
        // Format edges with proper indentation
        const edgesJson = JSON.stringify(template.edges, null, 3);
        // Split by newlines and add tab to the beginning of each line except the first and last
        const edgesLines = edgesJson.split('\n');
        if (edgesLines.length > 2) {
            formattedTemplates += `\t${edgesLines[0]}\n`;
            for (let i = 1; i < edgesLines.length - 1; i++) {
                formattedTemplates += `\t${edgesLines[i]}\n`;
            }
            formattedTemplates += `\t${edgesLines[edgesLines.length - 1]}\n`;
        }
        else {
            formattedTemplates += `\t${edgesJson}\n`;
        }
        formattedTemplates += `]\n\n`;
    });
    return formattedTemplates;
};
const generateAgentflowv2 = async (question, selectedChatModel) => {
    try {
        const agentFlow2Nodes = await getAllAgentFlow2Nodes();
        const toolNodes = await getAllToolNodes();
        const marketplaceTemplates = await getAllAgentflowv2Marketplaces();
        const writeCapableTools = await getWriteCapableToolNames();
        const prompt = prompt_1.sysPrompt
            .replace('{agentFlow2Nodes}', agentFlow2Nodes)
            .replace('{marketplaceTemplates}', marketplaceTemplates)
            .replace('{writeCapableTools}', writeCapableTools)
            .replace('{userRequest}', question);
        const options = {
            appDataSource: (0, getRunningExpressApp_1.getRunningExpressApp)().AppDataSource,
            databaseEntities: utils_2.databaseEntities,
            logger: logger_1.default
        };
        let response;
        if (process.env.MODE === Interface_1.MODE.QUEUE) {
            const predictionQueue = (0, getRunningExpressApp_1.getRunningExpressApp)().queueManager.getQueue('prediction');
            const job = await predictionQueue.addJob({
                prompt,
                question,
                toolNodes,
                selectedChatModel,
                isAgentFlowGenerator: true
            });
            logger_1.default.debug(`[server]: Generated Agentflowv2 Job added to queue: ${job.id}`);
            const queueEvents = predictionQueue.getQueueEvents();
            response = await job.waitUntilFinished(queueEvents);
        }
        else {
            response = await (0, accelance_components_1.generateAgentflowv2)({ prompt, componentNodes: (0, getRunningExpressApp_1.getRunningExpressApp)().nodesPool.componentNodes, toolNodes, selectedChatModel }, question, options);
        }
        try {
            // Try to parse and validate the response if it's a string
            if (typeof response === 'string') {
                const parsedResponse = JSON.parse(response);
                const validatedResponse = AgentFlowV2Type.parse(parsedResponse);
                return validatedResponse;
            }
            // If response is already an object
            else if (typeof response === 'object') {
                const validatedResponse = AgentFlowV2Type.parse(response);
                return validatedResponse;
            }
            // Unexpected response type
            else {
                throw new Error(`Unexpected response type: ${typeof response}`);
            }
        }
        catch (parseError) {
            console.error('Failed to parse or validate response:', parseError);
            // If parsing fails, return an error object
            return {
                error: 'Failed to validate response format',
                rawResponse: response
            }; // Type assertion to avoid type errors
        }
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: generateAgentflowv2 - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    generateAgentflowv2
};
//# sourceMappingURL=index.js.map