"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const custom_mcp_servers_1 = __importDefault(require("../custom-mcp-servers"));
// The official, public MCP registry (a community good run alongside the Model Context
// Protocol spec, not a private/ToS-restricted directory) -- unauthenticated, no API key needed.
const REGISTRY_BASE_URL = 'https://registry.modelcontextprotocol.io';
// oci/docker packages are deliberately excluded: launching them requires `docker run`, which
// this platform's MCP command-flag validator blocks outright (a materially more severe risk
// class than npx/uvx -- host mounts, container escape surface, etc.) -- not something this
// pass reopens. npm+pypi cover the large majority of real-world community MCP servers anyway.
const SUPPORTED_PACKAGE_REGISTRY_TYPES = ['npm', 'pypi'];
const normalizeInputs = (inputs) => (Array.isArray(inputs) ? inputs : []).map((i) => ({
    name: i.name,
    description: i.description,
    isRequired: i.isRequired === true,
    isSecret: i.isSecret === true,
    valueHint: typeof i.value === 'string' ? i.value : undefined
}));
const normalizeServerEntry = (entry) => {
    const server = entry?.server || {};
    const remoteRaw = Array.isArray(server.remotes) && server.remotes.length > 0 ? server.remotes[0] : null;
    const supportedPackage = Array.isArray(server.packages)
        ? server.packages.find((p) => SUPPORTED_PACKAGE_REGISTRY_TYPES.includes(p?.registryType))
        : null;
    let transport = 'unsupported';
    if (remoteRaw)
        transport = 'remote';
    else if (supportedPackage)
        transport = 'stdio';
    return {
        id: server.name,
        name: (server.name || '').split('/').pop() || server.name,
        description: server.description,
        repositoryUrl: server.repository?.url,
        version: server.version,
        transport,
        remote: remoteRaw ? { type: remoteRaw.type, url: remoteRaw.url, headers: normalizeInputs(remoteRaw.headers) } : undefined,
        stdio: supportedPackage
            ? {
                registryType: supportedPackage.registryType,
                identifier: supportedPackage.identifier,
                version: supportedPackage.version,
                runtimeHint: supportedPackage.runtimeHint,
                environmentVariables: normalizeInputs(supportedPackage.environmentVariables)
            }
            : undefined
    };
};
const searchServers = async (query, cursor) => {
    try {
        const params = new URLSearchParams();
        if (query)
            params.set('search', query);
        params.set('limit', '24');
        if (cursor)
            params.set('cursor', cursor);
        const response = await fetch(`${REGISTRY_BASE_URL}/v0/servers?${params.toString()}`);
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`MCP registry error ${response.status}: ${text}`);
        }
        const data = await response.json();
        const servers = (Array.isArray(data?.servers) ? data.servers : []).map(normalizeServerEntry);
        return { servers, nextCursor: data?.metadata?.nextCursor };
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: mcpRegistryService.searchServers - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// There's no confirmed single-item GET-by-name endpoint on the registry (a guessed path 404'd);
// searching by the exact name reliably returns just that one entry, so this re-fetches server-side
// rather than trusting a client-supplied server definition at import time.
const getServerByName = async (name) => {
    const params = new URLSearchParams({ search: name, limit: '10' });
    const response = await fetch(`${REGISTRY_BASE_URL}/v0/servers?${params.toString()}`);
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`MCP registry error ${response.status}: ${text}`);
    }
    const data = await response.json();
    const match = (Array.isArray(data?.servers) ? data.servers : []).find((e) => e?.server?.name === name);
    if (!match) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `MCP registry server "${name}" not found`);
    }
    return normalizeServerEntry(match);
};
const buildStdioLaunch = (stdio) => {
    const pkgRef = stdio.version ? `${stdio.identifier}@${stdio.version}` : stdio.identifier;
    if (stdio.registryType === 'npm') {
        return { command: 'npx', args: ['-y', pkgRef] };
    }
    if (stdio.registryType === 'pypi') {
        return { command: 'uvx', args: [pkgRef] };
    }
    throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Unsupported package registry type "${stdio.registryType}"`);
};
const buildValuesFromDeclaration = (declared, supplied) => {
    const values = {};
    for (const input of declared) {
        const value = supplied?.[input.name];
        if (input.isRequired && !value) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `"${input.name}" is required`);
        }
        if (value)
            values[input.name] = value;
    }
    return values;
};
const importServer = async (workspaceId, orgId, registryId, transport, headerValues, envValues) => {
    try {
        const entry = await getServerByName(registryId);
        let toolBody;
        if (transport === 'remote') {
            if (!entry.remote) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'This server has no remote (URL-based) transport option');
            }
            const headers = buildValuesFromDeclaration(entry.remote.headers, headerValues);
            toolBody = {
                name: entry.name,
                transportType: 'url',
                serverUrl: entry.remote.url,
                ...(Object.keys(headers).length > 0 ? { authType: 'CUSTOM_HEADERS', authConfig: { headers } } : {})
            };
        }
        else {
            if (!entry.stdio) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'This server has no supported local-process (npm/pypi) transport option');
            }
            const { command, args } = buildStdioLaunch(entry.stdio);
            const env = buildValuesFromDeclaration(entry.stdio.environmentVariables, envValues);
            toolBody = {
                name: entry.name,
                transportType: 'stdio',
                command,
                args,
                ...(Object.keys(env).length > 0 ? { env } : {})
            };
        }
        toolBody.workspaceId = workspaceId;
        const created = await custom_mcp_servers_1.default.createCustomMcpServer(toolBody, orgId);
        try {
            return await custom_mcp_servers_1.default.authorizeCustomMcpServer(created.id, workspaceId);
        }
        catch (authorizeError) {
            // Creation succeeded even if the handshake failed -- surface both, don't lose the created record.
            return { ...created, authorizeError: (0, utils_1.getErrorMessage)(authorizeError) };
        }
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError)
            throw error;
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: mcpRegistryService.importServer - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    searchServers,
    importServer
};
//# sourceMappingURL=index.js.map