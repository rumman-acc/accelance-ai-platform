"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const core_1 = require("./core");
const codeExample = `{
    "id": {
        "type": "string",
        "required": true,
        "in": "path",
        "description": "ID of the item to delete. /:id"
    },
    "force": {
        "type": "string",
        "in": "query",
        "description": "Force delete the item. ?force=true"
    }
}`;
class RequestsDelete_Tools {
    constructor() {
        this.label = 'Requests Delete';
        this.name = 'requestsDelete';
        this.version = 1.0;
        this.type = 'RequestsDelete';
        this.icon = 'del.png';
        this.category = 'Tools';
        this.description = 'Execute HTTP DELETE requests';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(core_1.RequestsDeleteTool), 'Tool'];
        this.inputs = [
            {
                label: 'URL',
                name: 'requestsDeleteUrl',
                type: 'string',
                acceptVariable: true
            },
            {
                label: 'Name',
                name: 'requestsDeleteName',
                type: 'string',
                default: 'requests_delete',
                description: 'Name of the tool',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Description',
                name: 'requestsDeleteDescription',
                type: 'string',
                rows: 4,
                default: core_1.desc,
                description: 'Describe to LLM when it should use this tool',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Headers',
                name: 'requestsDeleteHeaders',
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
                name: 'requestsDeleteQueryParamsSchema',
                type: 'code',
                description: 'Description of the available query params to enable LLM to figure out which query params to use',
                placeholder: `{
    "id": {
        "type": "string",
        "required": true,
        "in": "path",
        "description": "ID of the item to delete. /:id"
    },
    "force": {
        "type": "string",
        "in": "query",
        "description": "Force delete the item. ?force=true"
    }
}`,
                optional: true,
                hideCodeExecute: true,
                additionalParams: true,
                codeExample: codeExample
            },
            {
                label: 'Max Output Length',
                name: 'requestsDeleteMaxOutputLength',
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
        const headers = nodeData.inputs?.headers || nodeData.inputs?.requestsDeleteHeaders;
        const url = nodeData.inputs?.url || nodeData.inputs?.requestsDeleteUrl;
        const description = nodeData.inputs?.description || nodeData.inputs?.requestsDeleteDescription;
        const name = nodeData.inputs?.name || nodeData.inputs?.requestsDeleteName;
        const queryParamsSchema = nodeData.inputs?.queryParamsSchema || nodeData.inputs?.requestsDeleteQueryParamsSchema;
        const maxOutputLength = nodeData.inputs?.requestsDeleteMaxOutputLength;
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
        return new core_1.RequestsDeleteTool(obj);
    }
}
module.exports = { nodeClass: RequestsDelete_Tools };
//# sourceMappingURL=RequestsDelete.js.map