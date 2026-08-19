"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
const codeExample = `{
    "id": {
        "type": "string",
        "required": true,
        "in": "path",
        "description": "ID of the item to get. /:id"
    },
    "limit": {
        "type": "string",
        "in": "query",
        "description": "Limit the number of items to get. ?limit=10"
    }
}`;
class RequestsGet_Tools {
    constructor() {
        this.label = 'Requests Get';
        this.name = 'requestsGet';
        this.version = 2.0;
        this.type = 'RequestsGet';
        this.icon = 'get.png';
        this.category = 'Tools';
        this.description = 'Execute HTTP GET requests';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(core_1.RequestsGetTool), 'Tool'];
        this.inputs = [
            {
                label: 'URL',
                name: 'requestsGetUrl',
                type: 'string',
                acceptVariable: true
            },
            {
                label: 'Name',
                name: 'requestsGetName',
                type: 'string',
                default: 'requests_get',
                description: 'Name of the tool',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Description',
                name: 'requestsGetDescription',
                type: 'string',
                rows: 4,
                default: core_1.desc,
                description: 'Describe to LLM when it should use this tool',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Headers',
                name: 'requestsGetHeaders',
                type: 'string',
                rows: 4,
                acceptVariable: true,
                additionalParams: true,
                optional: true,
                placeholder: `{
    "Authorization": "Bearer <token>"
}`
            },
            {
                label: 'Query Params Schema',
                name: 'requestsGetQueryParamsSchema',
                type: 'code',
                description: 'Description of the available query params to enable LLM to figure out which query params to use',
                placeholder: `{
    "id": {
        "type": "string",
        "required": true,
        "in": "path",
        "description": "ID of the item to get. /:id"
    },
    "limit": {
        "type": "string",
        "in": "query",
        "description": "Limit the number of items to get. ?limit=10"
    }
}`,
                optional: true,
                hideCodeExecute: true,
                additionalParams: true,
                codeExample: codeExample
            },
            {
                label: 'Max Output Length',
                name: 'requestsGetMaxOutputLength',
                type: 'number',
                description: 'Max length of the output. Remove this if you want to return the entire response',
                default: '2000',
                step: 1,
                optional: true,
                additionalParams: true
            }
        ];
    }
    async init(nodeData) {
        const headers = nodeData.inputs?.headers || nodeData.inputs?.requestsGetHeaders;
        const url = nodeData.inputs?.url || nodeData.inputs?.requestsGetUrl;
        const description = nodeData.inputs?.description || nodeData.inputs?.requestsGetDescription;
        const name = nodeData.inputs?.name || nodeData.inputs?.requestsGetName;
        const queryParamsSchema = nodeData.inputs?.queryParamsSchema || nodeData.inputs?.requestsGetQueryParamsSchema;
        const maxOutputLength = nodeData.inputs?.requestsGetMaxOutputLength;
        const obj = {};
        if (url)
            obj.url = (0, utils_1.stripHTMLFromToolInput)(url);
        if (description)
            obj.description = description;
        if (name)
            obj.name = name
                .toLowerCase()
                .replace(/ /g, '_')
                .replace(/[^a-z0-9_-]/g, '');
        if (queryParamsSchema)
            obj.queryParamsSchema = queryParamsSchema;
        if (maxOutputLength)
            obj.maxOutputLength = parseInt(maxOutputLength, 10);
        if (headers) {
            const parsedHeaders = typeof headers === 'object' ? headers : (0, utils_1.parseJsonBody)((0, utils_1.stripHTMLFromToolInput)(headers));
            obj.headers = parsedHeaders;
        }
        return new core_1.RequestsGetTool(obj);
    }
}
module.exports = { nodeClass: RequestsGet_Tools };
//# sourceMappingURL=RequestsGet.js.map