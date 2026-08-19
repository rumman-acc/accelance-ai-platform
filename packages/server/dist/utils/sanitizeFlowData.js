"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeFlowDataForPublicEndpoint = void 0;
const SENSITIVE_HEADER_KEYS = new Set(['authorization', 'x-api-key', 'x-auth-token', 'cookie']);
/**
 * Sanitizes flowData before returning it from a public endpoint.
 * Strips password/file/folder inputs, credential ID references, and
 * auth-related HTTP headers so sensitive credentials are never exposed.
 */
const sanitizeFlowDataForPublicEndpoint = (flowDataString) => {
    if (!flowDataString)
        return flowDataString;
    try {
        const flowData = JSON.parse(flowDataString);
        if (!Array.isArray(flowData.nodes))
            return flowDataString;
        for (const node of flowData.nodes) {
            if (!node.data)
                continue;
            // Remove credential ID reference
            delete node.data.credential;
            const inputs = node.data.inputs;
            if (!inputs)
                continue;
            const inputParams = node.data.inputParams ?? [];
            const sanitizedInputs = {};
            for (const key of Object.keys(inputs)) {
                const param = inputParams.find((p) => p.name === key);
                if (param && (param.type === 'password' || param.type === 'file' || param.type === 'folder')) {
                    continue;
                }
                if (key === 'headers' && inputs[key]) {
                    try {
                        const rawHeaders = inputs[key];
                        // Array format: [{ key: string, value: string }, ...] (e.g. HTTP agentflow node)
                        if (Array.isArray(rawHeaders)) {
                            sanitizedInputs[key] = rawHeaders.filter((h) => !h.key || !SENSITIVE_HEADER_KEYS.has(h.key.toLowerCase()));
                            continue;
                        }
                        // Object/string format: Record<string, string> or JSON string thereof
                        const headers = typeof rawHeaders === 'string' ? JSON.parse(rawHeaders) : { ...rawHeaders };
                        for (const h of Object.keys(headers)) {
                            if (SENSITIVE_HEADER_KEYS.has(h.toLowerCase()))
                                delete headers[h];
                        }
                        sanitizedInputs[key] = typeof rawHeaders === 'string' ? JSON.stringify(headers) : headers;
                        continue;
                    }
                    catch {
                        // Drop headers that cannot be parsed
                        continue;
                    }
                }
                sanitizedInputs[key] = inputs[key];
            }
            node.data.inputs = sanitizedInputs;
        }
        return JSON.stringify(flowData);
    }
    catch {
        return JSON.stringify({ nodes: [], edges: [] });
    }
};
exports.sanitizeFlowDataForPublicEndpoint = sanitizeFlowDataForPublicEndpoint;
//# sourceMappingURL=sanitizeFlowData.js.map