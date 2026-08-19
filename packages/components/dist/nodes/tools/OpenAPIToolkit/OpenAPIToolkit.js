"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const js_yaml_1 = require("js-yaml");
const src_1 = require("../../../src");
const json_schema_ref_parser_1 = __importDefault(require("@apidevtools/json-schema-ref-parser"));
const v3_1 = require("zod/v3");
const core_1 = require("./core");
const httpSecurity_1 = require("../../../src/httpSecurity");
class OpenAPIToolkit_Tools {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            listServers: async (nodeData, options) => {
                try {
                    const inputType = nodeData.inputs?.inputType;
                    const openApiFile = nodeData.inputs?.openApiFile;
                    const openApiLink = nodeData.inputs?.openApiLink;
                    const specData = await this.loadOpenApiSpec({
                        inputType,
                        openApiFile,
                        openApiLink
                    }, options);
                    if (!specData)
                        return [];
                    const _data = await json_schema_ref_parser_1.default.dereference(specData);
                    const items = [];
                    const servers = _data.servers || [];
                    if (servers.length === 0) {
                        return [
                            {
                                label: 'No Servers Found',
                                name: 'error',
                                description: 'No servers defined in the OpenAPI specification'
                            }
                        ];
                    }
                    for (let i = 0; i < servers.length; i++) {
                        const server = servers[i];
                        const serverUrl = server.url || `Server ${i + 1}`;
                        const serverDesc = server.description || serverUrl;
                        items.push({
                            label: serverUrl,
                            name: serverUrl,
                            description: serverDesc
                        });
                    }
                    return items;
                }
                catch (e) {
                    return [
                        {
                            label: 'No Servers Found',
                            name: 'error',
                            description: 'No available servers, check the link/file and refresh'
                        }
                    ];
                }
            },
            // Not a dropdown-options loader like the others -- invoked directly from the canvas
            // "Save to My Tools" button (see NodeInputHandler.jsx) via the same /node-load-method
            // endpoint. Returns one flattened, database-savable tool definition per selected
            // endpoint: {name, description, schema, func} where `schema` matches the flat
            // `Tool` entity format (see utils.convertSchemaToZod) and `func` is generated code
            // that performs the actual fetch -- the same shape the "Custom Tools" tab already
            // stores and the CustomTool node already executes. No new entity, no new node type.
            exportSelectedEndpointsAsTools: async (nodeData, options) => {
                const inputType = nodeData.inputs?.inputType;
                const openApiFile = nodeData.inputs?.openApiFile;
                const openApiLink = nodeData.inputs?.openApiLink;
                const selectedServer = nodeData.inputs?.selectedServer;
                const _headers = nodeData.inputs?.headers;
                const headers = typeof _headers === 'object' ? _headers : _headers ? JSON.parse(_headers) : {};
                const specData = await this.loadOpenApiSpec({ inputType, openApiFile, openApiLink }, options);
                if (!specData)
                    throw new Error('Failed to load OpenAPI spec');
                const _data = await json_schema_ref_parser_1.default.dereference(specData);
                let baseUrl;
                if (selectedServer && selectedServer !== 'error') {
                    baseUrl = selectedServer;
                }
                else {
                    baseUrl = _data.servers?.[0]?.url;
                }
                if (!baseUrl)
                    throw new Error('OpenAPI spec does not contain a server URL');
                const _selected = nodeData.inputs?.selectedEndpoints;
                let selected = [];
                if (_selected) {
                    try {
                        selected = typeof _selected === 'string' ? JSON.parse(_selected) : _selected;
                    }
                    catch (e) {
                        selected = [];
                    }
                }
                if (!selected.length)
                    throw new Error('Select at least one endpoint before saving');
                return exportEndpointsAsFlatTools(_data.paths, baseUrl, headers, selected);
            },
            listEndpoints: async (nodeData, options) => {
                try {
                    const inputType = nodeData.inputs?.inputType;
                    const openApiFile = nodeData.inputs?.openApiFile;
                    const openApiLink = nodeData.inputs?.openApiLink;
                    const specData = await this.loadOpenApiSpec({
                        inputType,
                        openApiFile,
                        openApiLink
                    }, options);
                    if (!specData)
                        return [];
                    const _data = await json_schema_ref_parser_1.default.dereference(specData);
                    const items = [];
                    const paths = _data.paths || {};
                    for (const path in paths) {
                        const methods = paths[path];
                        for (const method in methods) {
                            if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
                                const spec = methods[method];
                                const opId = spec.operationId || `${method.toUpperCase()} ${path}`;
                                const desc = spec.description || spec.summary || opId;
                                items.push({ label: opId, name: opId, description: desc });
                            }
                        }
                    }
                    items.sort((a, b) => a.label.localeCompare(b.label));
                    return items;
                }
                catch (e) {
                    return [
                        {
                            label: 'No Endpoints Found',
                            name: 'error',
                            description: 'No available endpoints, check the link/file and refresh'
                        }
                    ];
                }
            }
        };
        this.label = 'OpenAPI Toolkit';
        this.name = 'openAPIToolkit';
        this.version = 2.1;
        this.type = 'OpenAPIToolkit';
        this.icon = 'openapi.svg';
        this.category = 'Tools';
        this.description = 'Load OpenAPI specification, and converts each API endpoint to a tool';
        this.inputs = [
            {
                label: 'Input Type',
                name: 'inputType',
                type: 'options',
                options: [
                    {
                        label: 'Upload File',
                        name: 'file'
                    },
                    {
                        label: 'Provide Link',
                        name: 'link'
                    }
                ],
                default: 'file',
                description: 'Choose how to provide the OpenAPI specification'
            },
            {
                label: 'OpenAPI File',
                name: 'openApiFile',
                type: 'file',
                fileType: '.yaml,.json',
                description: 'Upload your OpenAPI specification file (YAML or JSON)',
                show: {
                    inputType: 'file'
                }
            },
            {
                label: 'OpenAPI Link',
                name: 'openApiLink',
                type: 'string',
                placeholder: 'https://api.example.com/openapi.yaml or https://api.example.com/openapi.json',
                description: 'Provide a link to your OpenAPI specification (YAML or JSON)',
                show: {
                    inputType: 'link'
                }
            },
            {
                label: 'Server',
                name: 'selectedServer',
                type: 'asyncOptions',
                loadMethod: 'listServers',
                description: 'Select which server to use for API calls',
                refresh: true
            },
            {
                label: 'Available Endpoints',
                name: 'selectedEndpoints',
                type: 'asyncMultiOptions',
                loadMethod: 'listEndpoints',
                description: 'Select which endpoints to expose as tools',
                refresh: true
            },
            {
                label: 'Return Direct',
                name: 'returnDirect',
                description: 'Return the output of the tool directly to the user',
                type: 'boolean',
                optional: true
            },
            {
                label: 'Headers',
                name: 'headers',
                type: 'json',
                description: 'Request headers to be sent with the API request. For example, {"Authorization": "Bearer token"}',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Remove null parameters',
                name: 'removeNulls',
                type: 'boolean',
                optional: true,
                description: 'Remove all keys with null values from the parsed arguments'
            },
            {
                label: 'Custom Code',
                name: 'customCode',
                type: 'code',
                hint: {
                    label: 'How to use',
                    value: core_1.howToUseCode
                },
                codeExample: core_1.defaultCode,
                description: `Custom code to return the output of the tool. The code should be a function that takes in the input and returns a string`,
                hideCodeExecute: true,
                default: core_1.defaultCode,
                additionalParams: true
            }
        ];
        this.baseClasses = [this.type, 'Tool'];
    }
    async init(nodeData, _, options) {
        const toolReturnDirect = nodeData.inputs?.returnDirect;
        const inputType = nodeData.inputs?.inputType;
        const openApiFile = nodeData.inputs?.openApiFile;
        const openApiLink = nodeData.inputs?.openApiLink;
        const selectedServer = nodeData.inputs?.selectedServer;
        const customCode = nodeData.inputs?.customCode;
        const _headers = nodeData.inputs?.headers;
        const removeNulls = nodeData.inputs?.removeNulls;
        const headers = typeof _headers === 'object' ? _headers : _headers ? JSON.parse(_headers) : {};
        const specData = await this.loadOpenApiSpec({
            inputType,
            openApiFile,
            openApiLink
        }, options);
        if (!specData)
            throw new Error('Failed to load OpenAPI spec');
        const _data = await json_schema_ref_parser_1.default.dereference(specData);
        // Use selected server or fallback to first server
        let baseUrl;
        if (selectedServer && selectedServer !== 'error') {
            baseUrl = selectedServer;
        }
        else {
            baseUrl = _data.servers?.[0]?.url;
        }
        if (!baseUrl)
            throw new Error('OpenAPI spec does not contain a server URL');
        const appDataSource = options.appDataSource;
        const databaseEntities = options.databaseEntities;
        const variables = await (0, src_1.getVars)(appDataSource, databaseEntities, nodeData, options);
        const flow = { chatflowId: options.chatflowid };
        let tools = getTools(_data.paths, baseUrl, headers, variables, flow, toolReturnDirect, customCode, removeNulls);
        // Filter by selected endpoints if provided
        const _selected = nodeData.inputs?.selectedEndpoints;
        let selected = [];
        if (_selected) {
            try {
                selected = typeof _selected === 'string' ? JSON.parse(_selected) : _selected;
            }
            catch (e) {
                selected = [];
            }
        }
        if (selected.length) {
            tools = tools.filter((t) => selected.includes(t.name));
        }
        return tools;
    }
    async loadOpenApiSpec(args, options) {
        const { inputType = 'file', openApiFile = '', openApiLink = '' } = args;
        try {
            if (inputType === 'link' && openApiLink) {
                const res = await (0, httpSecurity_1.secureFetch)(openApiLink);
                const text = await res.text();
                // Auto-detect format from URL extension or content
                const isJsonUrl = openApiLink.toLowerCase().includes('.json');
                const isYamlUrl = openApiLink.toLowerCase().includes('.yaml') || openApiLink.toLowerCase().includes('.yml');
                if (isJsonUrl) {
                    return JSON.parse(text);
                }
                else if (isYamlUrl) {
                    return (0, js_yaml_1.load)(text);
                }
                else {
                    // Auto-detect format from content
                    try {
                        return JSON.parse(text);
                    }
                    catch (_) {
                        return (0, js_yaml_1.load)(text);
                    }
                }
            }
            if (inputType === 'file' && openApiFile) {
                let utf8String;
                let fileName = '';
                if (openApiFile.startsWith('FILE-STORAGE::')) {
                    const file = openApiFile.replace('FILE-STORAGE::', '');
                    fileName = file;
                    const orgId = options.orgId;
                    const chatflowid = options.chatflowid;
                    const fileData = await (0, src_1.getFileFromStorage)(file, orgId, chatflowid);
                    utf8String = fileData.toString('utf-8');
                }
                else {
                    // Extract filename from data URI if possible
                    const splitDataURI = openApiFile.split(',');
                    const mimeType = splitDataURI[0] || '';
                    if (mimeType.includes('filename=')) {
                        const filenameMatch = mimeType.match(/filename=([^;]+)/);
                        if (filenameMatch) {
                            fileName = filenameMatch[1];
                        }
                    }
                    splitDataURI.pop();
                    const bf = Buffer.from(splitDataURI.pop() || '', 'base64');
                    utf8String = bf.toString('utf-8');
                }
                // Auto-detect format from file extension or content
                const isJsonFile = fileName.toLowerCase().endsWith('.json');
                const isYamlFile = fileName.toLowerCase().endsWith('.yaml') || fileName.toLowerCase().endsWith('.yml');
                if (isJsonFile) {
                    return JSON.parse(utf8String);
                }
                else if (isYamlFile) {
                    return (0, js_yaml_1.load)(utf8String);
                }
                else {
                    // Auto-detect format from content
                    try {
                        return JSON.parse(utf8String);
                    }
                    catch (_) {
                        return (0, js_yaml_1.load)(utf8String);
                    }
                }
            }
        }
        catch (e) {
            console.error('Error loading OpenAPI spec:', e);
            return null;
        }
        return null;
    }
}
const jsonSchemaToZodSchema = (schema, requiredList, keyName) => {
    if (schema.properties) {
        // Handle object types by recursively processing properties
        const zodShape = {};
        for (const key in schema.properties) {
            zodShape[key] = jsonSchemaToZodSchema(schema.properties[key], requiredList, key);
        }
        return v3_1.z.object(zodShape);
    }
    else if (schema.oneOf || schema.anyOf) {
        // Handle oneOf/anyOf by mapping each option to a Zod schema
        const schemas = schema.oneOf || schema.anyOf;
        const zodSchemas = schemas.map((subSchema) => jsonSchemaToZodSchema(subSchema, requiredList, keyName));
        return v3_1.z.union(zodSchemas).describe(schema?.description ?? schema?.title ?? keyName);
    }
    else if (schema.enum) {
        // Handle enum types with their title and description
        return requiredList.includes(keyName)
            ? v3_1.z.enum(schema.enum).describe(schema?.description ?? schema?.title ?? keyName)
            : v3_1.z
                .enum(schema.enum)
                .describe(schema?.description ?? schema?.title ?? keyName)
                .optional();
    }
    else if (schema.type === 'string') {
        return requiredList.includes(keyName)
            ? v3_1.z.string({ required_error: `${keyName} required` }).describe(schema?.description ?? keyName)
            : v3_1.z
                .string()
                .describe(schema?.description ?? keyName)
                .optional();
    }
    else if (schema.type === 'array') {
        return v3_1.z.array(jsonSchemaToZodSchema(schema.items, requiredList, keyName));
    }
    else if (schema.type === 'boolean') {
        return requiredList.includes(keyName)
            ? v3_1.z.boolean({ required_error: `${keyName} required` }).describe(schema?.description ?? keyName)
            : v3_1.z
                .boolean()
                .describe(schema?.description ?? keyName)
                .optional();
    }
    else if (schema.type === 'number') {
        let numberSchema = v3_1.z.number();
        if (typeof schema.minimum === 'number') {
            numberSchema = numberSchema.min(schema.minimum);
        }
        if (typeof schema.maximum === 'number') {
            numberSchema = numberSchema.max(schema.maximum);
        }
        return requiredList.includes(keyName)
            ? numberSchema.describe(schema?.description ?? keyName)
            : numberSchema.describe(schema?.description ?? keyName).optional();
    }
    else if (schema.type === 'integer') {
        let numberSchema = v3_1.z.number().int();
        return requiredList.includes(keyName)
            ? numberSchema.describe(schema?.description ?? keyName)
            : numberSchema.describe(schema?.description ?? keyName).optional();
    }
    else if (schema.type === 'null') {
        return v3_1.z.null();
    }
    console.error(`jsonSchemaToZodSchema returns UNKNOWN! ${keyName}`, schema);
    // Fallback to unknown type if unrecognized
    return v3_1.z.unknown();
};
const extractParameters = (param, paramZodObj) => {
    const paramSchema = param.schema;
    const paramName = param.name;
    const paramDesc = paramSchema.description || paramSchema.title || param.description || param.name;
    if (paramSchema.enum) {
        const enumValues = paramSchema.enum;
        // Combine title and description from schema
        const enumDesc = [paramSchema.title, paramSchema.description, `Valid values: ${enumValues.join(', ')}`].filter(Boolean).join('. ');
        if (param.required) {
            paramZodObj[paramName] = v3_1.z.enum(enumValues).describe(enumDesc);
        }
        else {
            paramZodObj[paramName] = v3_1.z
                .enum(enumValues)
                .describe(enumDesc)
                .optional();
        }
        return paramZodObj;
    }
    else if (paramSchema.type === 'string') {
        if (param.required) {
            paramZodObj[paramName] = v3_1.z.string({ required_error: `${paramName} required` }).describe(paramDesc);
        }
        else {
            paramZodObj[paramName] = v3_1.z.string().describe(paramDesc).optional();
        }
    }
    else if (paramSchema.type === 'number') {
        if (param.required) {
            paramZodObj[paramName] = v3_1.z.number({ required_error: `${paramName} required` }).describe(paramDesc);
        }
        else {
            paramZodObj[paramName] = v3_1.z.number().describe(paramDesc).optional();
        }
    }
    else if (paramSchema.type === 'boolean') {
        if (param.required) {
            paramZodObj[paramName] = v3_1.z.boolean({ required_error: `${paramName} required` }).describe(paramDesc);
        }
        else {
            paramZodObj[paramName] = v3_1.z.boolean().describe(paramDesc).optional();
        }
    }
    else if (paramSchema.anyOf || paramSchema.type === 'anyOf') {
        // Handle anyOf by using jsonSchemaToZodSchema
        const requiredList = param.required ? [paramName] : [];
        paramZodObj[paramName] = jsonSchemaToZodSchema(paramSchema, requiredList, paramName);
    }
    return paramZodObj;
};
const getTools = (paths, baseUrl, headers, variables, flow, returnDirect, customCode, removeNulls) => {
    const tools = [];
    for (const path in paths) {
        // example of path: "/engines"
        const methods = paths[path];
        for (const method in methods) {
            // example of method: "get"
            if (method !== 'get' && method !== 'post' && method !== 'put' && method !== 'delete' && method !== 'patch') {
                continue;
            }
            const spec = methods[method];
            const toolName = spec.operationId;
            const toolDesc = spec.description || spec.summary || toolName;
            let zodObj = {};
            if (spec.parameters) {
                // Get parameters with in = path
                let paramZodObjPath = {};
                for (const param of spec.parameters.filter((param) => param.in === 'path')) {
                    paramZodObjPath = extractParameters(param, paramZodObjPath);
                }
                // Get parameters with in = query
                let paramZodObjQuery = {};
                for (const param of spec.parameters.filter((param) => param.in === 'query')) {
                    paramZodObjQuery = extractParameters(param, paramZodObjQuery);
                }
                // Combine path and query parameters
                zodObj = {
                    ...zodObj,
                    PathParameters: v3_1.z.object(paramZodObjPath),
                    QueryParameters: v3_1.z.object(paramZodObjQuery)
                };
            }
            if (spec.requestBody) {
                let content = {};
                if (spec.requestBody.content['application/json']) {
                    content = spec.requestBody.content['application/json'];
                }
                else if (spec.requestBody.content['application/x-www-form-urlencoded']) {
                    content = spec.requestBody.content['application/x-www-form-urlencoded'];
                }
                else if (spec.requestBody.content['multipart/form-data']) {
                    content = spec.requestBody.content['multipart/form-data'];
                }
                else if (spec.requestBody.content['text/plain']) {
                    content = spec.requestBody.content['text/plain'];
                }
                const requestBodySchema = content.schema;
                if (requestBodySchema) {
                    const requiredList = requestBodySchema.required || [];
                    const requestBodyZodObj = jsonSchemaToZodSchema(requestBodySchema, requiredList, 'properties');
                    zodObj = {
                        ...zodObj,
                        RequestBody: requestBodyZodObj
                    };
                }
                else {
                    zodObj = {
                        ...zodObj,
                        input: v3_1.z.string().describe('Query input').optional()
                    };
                }
            }
            if (!spec.parameters && !spec.requestBody) {
                zodObj = {
                    input: v3_1.z.string().describe('Query input').optional()
                };
            }
            const toolObj = {
                name: toolName,
                description: toolDesc,
                schema: v3_1.z.object(zodObj),
                baseUrl: `${baseUrl}${path}`,
                method: method,
                headers,
                customCode,
                strict: spec['x-strict'] === true,
                removeNulls
            };
            const dynamicStructuredTool = new core_1.DynamicStructuredTool(toolObj);
            dynamicStructuredTool.setVariables(variables);
            dynamicStructuredTool.setFlowObject(flow);
            dynamicStructuredTool.returnDirect = returnDirect;
            if (toolName && toolDesc)
                tools.push(dynamicStructuredTool);
        }
    }
    return tools;
};
// Matches a safe JS identifier. Any OpenAPI parameter name that doesn't match this gets a
// generated fallback ($param1, $param2, ...) rather than being interpolated as-is into
// generated code -- defense in depth against a malformed/malicious spec smuggling something
// like `); maliciousCode(` through a parameter name, even though the generated code only ever
// runs inside the existing sandboxed CustomTool executor.
const SAFE_IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
// The `Tool` entity's schema format only supports flat, top-level primitive fields (see
// utils.convertSchemaToZod) -- no nested objects/arrays. Anything richer degrades to a
// string field with a note, rather than being dropped, so the LLM can still pass it (as a
// JSON string) instead of losing the parameter entirely.
const mapToFlatFieldType = (schema) => {
    if (!schema)
        return { type: 'string' };
    if (schema.type === 'number' || schema.type === 'integer')
        return { type: 'number' };
    if (schema.type === 'boolean')
        return { type: 'boolean' };
    if (schema.type === 'string' && schema.format === 'date')
        return { type: 'date' };
    if (schema.type === 'string')
        return { type: 'string' };
    if (schema.type === 'array' || schema.type === 'object' || schema.enum) {
        return { type: 'string', note: '(pass as a JSON string)' };
    }
    return { type: 'string' };
};
const buildFlatFields = (spec) => {
    const fields = [];
    const usedKeys = new Set();
    let anonCounter = 0;
    const toKey = (rawName) => {
        let key = SAFE_IDENTIFIER.test(rawName) ? rawName : `param${++anonCounter}`;
        while (usedKeys.has(key))
            key = `${key}_${++anonCounter}`;
        usedKeys.add(key);
        return key;
    };
    for (const param of spec.parameters || []) {
        if (param.in !== 'path' && param.in !== 'query')
            continue;
        const { type, note } = mapToFlatFieldType(param.schema);
        fields.push({
            key: toKey(param.name),
            property: param.name,
            description: [param.description, note].filter(Boolean).join(' '),
            type,
            required: param.in === 'path' ? true : !!param.required,
            in: param.in
        });
    }
    if (spec.requestBody) {
        const content = spec.requestBody.content?.['application/json'] ||
            spec.requestBody.content?.['application/x-www-form-urlencoded'] ||
            spec.requestBody.content?.['multipart/form-data'];
        const bodySchema = content?.schema;
        if (bodySchema?.properties) {
            const requiredList = bodySchema.required || [];
            for (const propName in bodySchema.properties) {
                const { type, note } = mapToFlatFieldType(bodySchema.properties[propName]);
                fields.push({
                    key: toKey(propName),
                    property: propName,
                    description: [bodySchema.properties[propName]?.description, note].filter(Boolean).join(' '),
                    type,
                    required: requiredList.includes(propName),
                    in: 'body'
                });
            }
        }
    }
    return fields;
};
const buildGeneratedFunc = (path, method, headers, fields) => {
    const pathFields = fields.filter((f) => f.in === 'path');
    const queryFields = fields.filter((f) => f.in === 'query');
    const bodyFields = fields.filter((f) => f.in === 'body');
    const pathSubstitutions = pathFields
        .map((f) => `    url = url.replace(${JSON.stringify(`{${f.property}}`)}, encodeURIComponent($${f.key} ?? ''));`)
        .join('\n');
    const queryAppends = queryFields
        .map((f) => `    if ($${f.key} !== undefined && $${f.key} !== null && $${f.key} !== '') queryParams.append(${JSON.stringify(f.property)}, $${f.key});`)
        .join('\n');
    const bodyObjectEntries = bodyFields.map((f) => `${JSON.stringify(f.property)}: $${f.key}`).join(', ');
    const hasBody = bodyFields.length > 0 && method.toUpperCase() !== 'GET';
    return `const fetch = require('node-fetch');
let url = ${JSON.stringify(path)};
${pathSubstitutions}
const queryParams = new URLSearchParams();
${queryAppends}
const qs = queryParams.toString();
if (qs) url += (url.includes('?') ? '&' : '?') + qs;
const options = {
    method: ${JSON.stringify(method.toUpperCase())},
    headers: ${JSON.stringify({ 'Content-Type': 'application/json', ...headers })}
};
${hasBody ? `options.body = JSON.stringify({ ${bodyObjectEntries} });` : ''}
try {
    const response = await fetch(url, options);
    const text = await response.text();
    if (!response.ok) {
        return \`Error \${response.status}: \${text}\`;
    }
    return text;
} catch (error) {
    return 'Error: ' + (error && error.message ? error.message : String(error));
}
`;
};
const exportEndpointsAsFlatTools = (paths, baseUrl, headers, selectedOperationIds) => {
    const results = [];
    for (const path in paths) {
        const methods = paths[path];
        for (const method in methods) {
            if (!['get', 'post', 'put', 'delete', 'patch'].includes(method))
                continue;
            const spec = methods[method];
            const operationId = spec.operationId || `${method.toUpperCase()} ${path}`;
            if (!selectedOperationIds.includes(operationId))
                continue;
            const fields = buildFlatFields(spec);
            const schema = fields.map((f) => ({
                // `property` becomes both the zod object key AND the `$<property>` sandbox
                // variable name the generated func below reads from (see CustomTool/core.ts
                // -- it exposes every top-level tool arg as `$<key>`). Must be the sanitized
                // `key`, not the raw OpenAPI param name, or the two would silently diverge
                // whenever the raw name isn't a valid JS identifier.
                property: f.key,
                description: f.key !== f.property ? `${f.description || f.property} (API parameter: ${f.property})` : f.description || f.property,
                type: f.type,
                required: f.required
            }));
            const func = buildGeneratedFunc(`${baseUrl}${path}`, method, headers, fields);
            results.push({
                name: operationId,
                description: spec.description || spec.summary || operationId,
                schema: JSON.stringify(schema),
                func
            });
        }
    }
    return results;
};
module.exports = { nodeClass: OpenAPIToolkit_Tools };
//# sourceMappingURL=OpenAPIToolkit.js.map