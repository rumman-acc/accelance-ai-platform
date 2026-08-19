"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicStructuredTool = exports.howToUseCode = exports.defaultCode = void 0;
const tools_1 = require("@langchain/core/tools");
const manager_1 = require("@langchain/core/callbacks/manager");
const utils_1 = require("../../../src/utils");
const removeNulls = (obj) => {
    Object.keys(obj).forEach((key) => {
        if (obj[key] === null) {
            delete obj[key];
        }
        else if (typeof obj[key] === 'object' && obj[key] !== null) {
            removeNulls(obj[key]);
            if (Object.keys(obj[key]).length === 0) {
                delete obj[key];
            }
        }
    });
    return obj;
};
exports.defaultCode = `const fetch = require('node-fetch');
const url = $url;
const options = $options;

try {
	const response = await fetch(url, options);
	const resp = await response.json();
	return JSON.stringify(resp);
} catch (error) {
	console.error(error);
	return '';
}
`;
exports.howToUseCode = `- **Libraries:**  
  You can use any libraries imported in Flowise.

- **Tool Input Arguments:**  
  Tool input arguments are available as the following variables:
  - \`$PathParameters\`
  - \`$QueryParameters\`
  - \`$RequestBody\`

- **HTTP Requests:**  
  By default, you can get the following values for making HTTP requests:
  - \`$url\`
  - \`$options\`

- **Default Flow Config:**  
  You can access the default flow configuration using these variables:
  - \`$flow.sessionId\`
  - \`$flow.chatId\`
  - \`$flow.chatflowId\`
  - \`$flow.input\`
  - \`$flow.state\`

- **Custom Variables:**  
  You can get custom variables using the syntax:
  - \`$vars.<variable-name>\`

- **Return Value:**  
  The function must return a **string** value at the end.

\`\`\`js
${exports.defaultCode}
\`\`\`
`;
const getUrl = (baseUrl, requestObject) => {
    let url = baseUrl;
    // Add PathParameters to URL if present
    if (requestObject.PathParameters) {
        for (const [key, value] of Object.entries(requestObject.PathParameters)) {
            url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
        }
    }
    // Add QueryParameters to URL if present
    if (requestObject.QueryParameters) {
        const queryParams = new URLSearchParams(requestObject.QueryParameters);
        url += `?${queryParams.toString()}`;
    }
    return url;
};
class ToolInputParsingException extends Error {
    constructor(message, output) {
        super(message);
        this.output = output;
    }
}
class DynamicStructuredTool extends tools_1.StructuredTool {
    constructor(fields) {
        super(fields);
        this.name = fields.name;
        this.description = fields.description;
        this.func = fields.func;
        this.returnDirect = fields.returnDirect ?? this.returnDirect;
        this.schema = fields.schema;
        this.baseUrl = fields.baseUrl;
        this.method = fields.method;
        this.headers = fields.headers;
        this.customCode = fields.customCode;
        this.strict = fields.strict;
        this.removeNulls = fields.removeNulls ?? false;
    }
    async call(arg, configArg, tags, flowConfig) {
        const config = (0, manager_1.parseCallbackConfigArg)(configArg);
        if (config.runName === undefined) {
            config.runName = this.name;
        }
        let parsed;
        try {
            parsed = await (0, utils_1.parseWithTypeConversion)(this.schema, arg);
        }
        catch (e) {
            throw new ToolInputParsingException(`Received tool input did not match expected schema ${e}`, JSON.stringify(arg));
        }
        const callbackManager_ = await manager_1.CallbackManager.configure(config.callbacks, this.callbacks, config.tags || tags, this.tags, config.metadata, this.metadata, { verbose: this.verbose });
        const runManager = await callbackManager_?.handleToolStart(this.toJSON(), typeof parsed === 'string' ? parsed : JSON.stringify(parsed), undefined, undefined, undefined, undefined, config.runName);
        let result;
        try {
            result = await this._call(parsed, runManager, flowConfig);
        }
        catch (e) {
            await runManager?.handleToolError(e);
            throw e;
        }
        if (result && typeof result !== 'string') {
            result = JSON.stringify(result);
        }
        await runManager?.handleToolEnd(result);
        return result;
    }
    // @ts-ignore
    async _call(arg, _, flowConfig) {
        let processedArg = { ...arg };
        if (this.removeNulls && typeof processedArg === 'object' && processedArg !== null) {
            processedArg = removeNulls(processedArg);
        }
        // Create additional sandbox variables for tool arguments
        const additionalSandbox = {};
        if (typeof processedArg === 'object' && Object.keys(processedArg).length) {
            for (const item in processedArg) {
                additionalSandbox[`$${item}`] = processedArg[item];
            }
        }
        // Prepare HTTP request options
        const callOptions = {
            method: this.method,
            headers: {
                'Content-Type': 'application/json',
                ...this.headers
            }
        };
        if (arg.RequestBody && this.method.toUpperCase() !== 'GET') {
            callOptions.body = JSON.stringify(arg.RequestBody);
        }
        additionalSandbox['$options'] = callOptions;
        // Generate complete URL
        const completeUrl = getUrl(this.baseUrl, arg);
        additionalSandbox['$url'] = completeUrl;
        // Prepare flow object for sandbox
        const flow = this.flowObj ? { ...this.flowObj, ...flowConfig } : {};
        const sandbox = (0, utils_1.createCodeExecutionSandbox)('', this.variables || [], flow, additionalSandbox);
        let response = await (0, utils_1.executeJavaScriptCode)(this.customCode || exports.defaultCode, sandbox);
        if (typeof response === 'object') {
            response = JSON.stringify(response);
        }
        return response;
    }
    setVariables(variables) {
        this.variables = variables;
    }
    setFlowObject(flow) {
        this.flowObj = flow;
    }
    isStrict() {
        return this.strict === true;
    }
}
exports.DynamicStructuredTool = DynamicStructuredTool;
//# sourceMappingURL=core.js.map