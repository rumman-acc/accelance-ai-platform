"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const v3_1 = require("zod/v3");
const uuid_1 = require("uuid");
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const buildChatflow_1 = require("../../utils/buildChatflow");
const mockRequest_1 = require("../../utils/mockRequest");
const index_1 = __importDefault(require("../mcp-server/index"));
const logger_1 = __importDefault(require("../../utils/logger"));
const Interface_1 = require("../../Interface");
/**
 * Build the MCP tool name from config + chatflow
 */
function getToolName(config, chatflow) {
    if (config.toolName)
        return config.toolName;
    // Sanitize the chatflow name to be a valid tool identifier
    return (chatflow.name
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .substring(0, 64) || 'chatflow_tool');
}
/**
 * Build the MCP tool description from config + chatflow
 */
function getToolDescription(config, chatflow) {
    if (config.description)
        return config.description;
    return `Execute the "${chatflow.name}" flow`;
}
/**
 * Determine the tool input type based on the chatflow type and flowData.
 * For AGENTFLOW, we look for a `startAgentflow` node and check its `startInputType` property.
 * If it's `formInput`, we return 'form', otherwise 'question'.
 * For other flow types, we default to 'question'.
 */
function getToolInputType(chatflow) {
    if (chatflow.type === 'AGENTFLOW') {
        try {
            const flowData = JSON.parse(chatflow.flowData);
            const nodes = flowData.nodes || [];
            const startNode = nodes.find((node) => node.data.name === 'startAgentflow');
            const startInputType = startNode?.data?.inputs?.startInputType;
            return startInputType === 'formInput' ? 'form' : 'question';
        }
        catch (error) {
            logger_1.default.error(`Failed to parse flowData for chatflow ${chatflow.id}: ${(0, utils_1.getErrorMessage)(error)}`);
            return 'question';
        }
    }
    return 'question';
}
/**
 * Build the zod input schema parameters for the tool.
 * For chatflows: always has a mandatory `question` string.
 * For agentflows: only allow one of `question` or `form` (object)
 */
function buildInputSchema(chatflow) {
    const inputType = getToolInputType(chatflow);
    if (inputType === 'form') {
        return buildFormInputSchema(chatflow);
    }
    return {
        question: v3_1.z.string().describe('The question or prompt to send to the chatflow')
    };
}
/**
 * Build the zod schema for form input, based on the `startAgentflow` node configuration.
 *
 * Example input:
 * ```json
    {
        "inputs": {
            "startInputType": "formInput",
            "formInputTypes": [
                {
                    "type": "string",
                    "label": "Name",
                    "name": "name",
                    "addOptions": ""
                },
                {
                    "type": "number",
                    "label": "Age",
                    "name": "age",
                    "addOptions": ""
                },
                {
                    "type": "boolean",
                    "label": "Adult",
                    "name": "is_adult",
                    "addOptions": ""
                },
                {
                    "type": "options",
                    "label": "Favorite Drink",
                    "name": "favorite_drink",
                    "addOptions": [
                        {
                            "option": "Tea"
                        },
                        {
                            "option": "Coffee"
                        }
                    ]
                }
            ]
        }
    }
    ```
 */
function buildFormInputSchema(chatflow) {
    try {
        const flowData = JSON.parse(chatflow.flowData);
        const nodes = flowData.nodes || [];
        const startNode = nodes.find((node) => node.data.name === 'startAgentflow');
        const formInputTypes = startNode?.data?.inputs?.formInputTypes;
        if (!formInputTypes || !Array.isArray(formInputTypes)) {
            throw new Error('Invalid form input configuration in chatflow');
        }
        const schemaShape = {};
        formInputTypes.forEach((input) => {
            switch (input.type) {
                case 'string':
                    schemaShape[input.name] = v3_1.z.string().describe(input.label);
                    break;
                case 'number':
                    schemaShape[input.name] = v3_1.z.number().describe(input.label);
                    break;
                case 'boolean':
                    schemaShape[input.name] = v3_1.z.boolean().describe(input.label);
                    break;
                case 'options': {
                    if (!Array.isArray(input.addOptions) || input.addOptions.length === 0) {
                        break;
                    }
                    const options = input.addOptions
                        .map((opt) => opt?.option)
                        .filter((option) => typeof option === 'string' && option.length > 0);
                    if (options.length === 0) {
                        break;
                    }
                    schemaShape[input.name] = v3_1.z.enum(options).describe(input.label);
                    break;
                }
                default:
                    throw new Error(`Unsupported form input type: ${input.type}`);
            }
        });
        return {
            form: v3_1.z.object(schemaShape).describe('Form inputs for the agent flow')
        };
    }
    catch (error) {
        logger_1.default.error(`Failed to build form input schema for chatflow ${chatflow.id}: ${(0, utils_1.getErrorMessage)(error)}`);
        // Fallback to a generic schema if there's an error
        throw new Error('Failed to build form input schema due to invalid configuration');
    }
}
/**
 * Callback function for MCP tool execution
 * @return The tool response content, extracted from the utilBuildChatflow result
 */
async function chatflowCallback(chatflow, chatId, req, args) {
    const inputType = getToolInputType(chatflow);
    const body = inputType === 'form' ? { form: args.form || {} } : { question: args.question || '' };
    const mockReq = (0, mockRequest_1.createMockRequest)({
        chatflowId: chatflow.id,
        body: {
            ...body,
            chatId
        },
        sourceRequest: req
    });
    const result = await (0, buildChatflow_1.utilBuildChatflow)(mockReq, true, Interface_1.ChatType.MCP);
    // Extract the text response from the result
    let textContent;
    if (typeof result === 'string') {
        textContent = result;
    }
    else if (result?.text) {
        textContent = result.text;
    }
    else if (result?.json) {
        textContent = JSON.stringify(result.json);
    }
    else {
        textContent = JSON.stringify(result);
    }
    return {
        content: [{ type: 'text', text: textContent }]
    };
}
/**
 * Handle an InternalAccelanceError from getChatflowByIdAndVerifyToken.
 * Writes the appropriate JSON-RPC error response and returns true if handled.
 * Returns false for unrecognised errors so the caller can rethrow.
 */
function handleServiceError(error, res) {
    if (error instanceof internalAccelanceError_1.InternalAccelanceError) {
        if (error.statusCode === http_status_codes_1.StatusCodes.UNAUTHORIZED) {
            res.status(401).json({
                jsonrpc: '2.0',
                error: { code: -32001, message: 'Unauthorized' },
                id: null
            });
            return true;
        }
        if (error.statusCode === http_status_codes_1.StatusCodes.NOT_FOUND) {
            res.status(404).json({
                jsonrpc: '2.0',
                error: { code: -32001, message: 'MCP server not found' },
                id: null
            });
            return true;
        }
    }
    return false;
}
/**
 * Handle an MCP protocol request (POST) for a given chatflowId + token.
 * Uses the MCP SDK in stateless mode (no session management).
 * The token is verified against the stored config (constant-time comparison).
 */
const handleMcpRequest = async (chatflowId, token, req, res) => {
    let chatflow;
    let config;
    try {
        chatflow = await index_1.default.getChatflowByIdAndVerifyToken(chatflowId, token);
        config = index_1.default.parseMcpConfig(chatflow);
    }
    catch (error) {
        if (handleServiceError(error, res))
            return;
        throw error;
    }
    if (!config || !config.enabled) {
        res.status(404).json({
            jsonrpc: '2.0',
            error: { code: -32001, message: 'MCP server not found' },
            id: null
        });
        return;
    }
    const toolName = getToolName(config, chatflow);
    const toolDescription = getToolDescription(config, chatflow);
    const inputSchema = buildInputSchema(chatflow);
    // Create a stateless MCP server for this request
    const mcpServer = new mcp_js_1.McpServer({
        name: `flowise-${toolName}`,
        version: '1.0.0'
    }, {
        capabilities: {
            tools: {}
        }
    });
    mcpServer.tool(toolName, toolDescription, inputSchema, async (args) => {
        try {
            const chatId = (0, uuid_1.v4)(); // Generate a unique chat ID for this execution
            return await chatflowCallback(chatflow, chatId, req, args);
        }
        catch (error) {
            const errorMessage = (0, utils_1.getErrorMessage)(error);
            logger_1.default.error(`[MCP] Error executing tool ${toolName} for chatflow ${chatflow.id}: ${errorMessage}`);
            return {
                content: [{ type: 'text', text: 'An error occurred while executing the tool. Please try again later.' }],
                isError: true
            };
        }
    });
    // Create a stateless transport (no session management)
    const transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
        sessionIdGenerator: undefined
    });
    // Connect server to transport
    await mcpServer.connect(transport);
    // Clean up when the HTTP response finishes.
    // NOTE: We must NOT close the server immediately after handleRequest() because
    // the transport's handlePostRequest() fires onmessage() without awaiting it.
    // If we close() too early, the SSE response stream is terminated before the
    // McpServer has finished processing the request and writing its JSON-RPC response.
    res.on('close', () => {
        mcpServer.close().catch(() => { });
    });
    // Handle the incoming request.
    // The transport handles POST (JSON-RPC), GET (SSE), and DELETE (session).
    await transport.handleRequest(req, res, req.body);
};
/**
 * Handle DELETE requests for session termination (stateless mode rejects with 405)
 */
const handleMcpDeleteRequest = async (chatflowId, req, res) => {
    // In stateless mode, DELETE is not applicable
    res.status(405).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Session termination is not supported in stateless mode.' },
        id: null
    });
};
exports.default = {
    handleMcpRequest,
    handleMcpDeleteRequest
};
//# sourceMappingURL=index.js.map