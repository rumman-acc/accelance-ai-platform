"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const CustomMcpServer_1 = require("../../database/entities/CustomMcpServer");
const Interface_1 = require("../../Interface");
const internalAccelanceError_1 = require("../../errors/internalAccelanceError");
const utils_1 = require("../../errors/utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const utils_2 = require("../../utils");
const accelance_components_1 = require("accelance-components");
const utils_3 = require("../../utils");
const logger_1 = __importDefault(require("../../utils/logger"));
const Interface_Metrics_1 = require("../../Interface.Metrics");
const REDACTED_VALUE = '************';
const DEFAULT_TOOLS_MAX_BYTES = 512 * 1024;
const DEFAULT_AUTHORIZE_TIMEOUT_MS = 15_000;
const MIN_AUTHORIZE_TIMEOUT_MS = 1_000;
const getToolsMaxBytes = () => {
    const raw = process.env.CUSTOM_MCP_TOOLS_MAX_BYTES;
    if (raw === undefined || raw === '')
        return DEFAULT_TOOLS_MAX_BYTES;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed))
        return DEFAULT_TOOLS_MAX_BYTES;
    return parsed;
};
const getAuthorizeTimeoutMs = () => {
    const raw = process.env.CUSTOM_MCP_AUTHORIZE_TIMEOUT_MS;
    if (raw === undefined || raw === '')
        return DEFAULT_AUTHORIZE_TIMEOUT_MS;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < MIN_AUTHORIZE_TIMEOUT_MS)
        return DEFAULT_AUTHORIZE_TIMEOUT_MS;
    return parsed;
};
const withTimeout = (promise, ms, message) => {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};
const toBadRequest = async (fn, fallbackMessage) => {
    try {
        await fn();
    }
    catch (err) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, fallbackMessage);
    }
};
const assertSafeServerUrl = async (url) => {
    if (!(0, accelance_components_1.isValidURL)(url)) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid Server URL: "${url}" is not a valid URL`);
    }
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid Server URL: only http and https are allowed, got "${parsed.protocol.replace(':', '')}"`);
    }
    // Runs the shared HTTP deny-list check (RFC1918, loopback, link-local, IMDS, ...)
    // with opt-out via HTTP_SECURITY_CHECK=false and allowlist via HTTP_DENY_LIST env.
    await toBadRequest(() => (0, accelance_components_1.checkDenyList)(url), 'Server URL is not allowed by policy');
};
const assertValidHeaders = (headers) => {
    if (!headers || typeof headers !== 'object')
        return;
    try {
        (0, accelance_components_1.validateCustomHeaders)(headers);
    }
    catch (err) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, (0, utils_1.getErrorMessage)(err));
    }
};
const assertValidStdioConfig = (command, args, env) => {
    if (!command || typeof command !== 'string') {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'A stdio MCP server requires a "command"');
    }
    const argsArray = Array.isArray(args) ? args : [];
    try {
        (0, accelance_components_1.validateMCPServerConfig)({ command, args: argsArray, env: env && typeof env === 'object' ? env : undefined });
    }
    catch (err) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, (0, utils_1.getErrorMessage)(err));
    }
};
const maskEnv = (env) => {
    const masked = {};
    for (const key of Object.keys(env)) {
        masked[key] = REDACTED_VALUE;
    }
    return masked;
};
/**
 * Returns only the origin + '/**' to avoid leaking token-bearing path segments
 * e.g. https://api.test-server.com/mcp/server/w5pqFCYcsp6TAzaJ → https://api.test-server.com/********
 */
const maskServerUrl = (url) => {
    try {
        const parsed = new URL(url);
        if (parsed.pathname && parsed.pathname !== '/') {
            return `${parsed.origin}/${REDACTED_VALUE}`;
        }
        return parsed.origin;
    }
    catch {
        return REDACTED_VALUE;
    }
};
const sanitizeCustomMcpServer = ({ authConfig: _authConfig, env: _env, ...rest }) => ({
    ...rest,
    serverUrl: rest.serverUrl ? maskServerUrl(rest.serverUrl) : undefined,
    env: _env ? '(configured)' : undefined
});
const createCustomMcpServer = async (requestBody, orgId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const newRecord = new CustomMcpServer_1.CustomMcpServer();
        if (requestBody.transportType === Interface_1.CustomMcpServerTransportType.STDIO) {
            assertValidStdioConfig(requestBody.command, requestBody.args, requestBody.env);
            requestBody.args = JSON.stringify(Array.isArray(requestBody.args) ? requestBody.args : []);
            requestBody.env = requestBody.env && typeof requestBody.env === 'object' ? await (0, utils_2.encryptCredentialData)(requestBody.env) : null;
            requestBody.serverUrl = null;
            requestBody.authConfig = null;
        }
        else {
            requestBody.transportType = Interface_1.CustomMcpServerTransportType.URL;
            if (requestBody.serverUrl)
                await assertSafeServerUrl(requestBody.serverUrl);
            requestBody.command = null;
            requestBody.args = null;
            requestBody.env = null;
            // Encrypt authConfig if present
            if (requestBody.authConfig && typeof requestBody.authConfig === 'object') {
                if (requestBody.authType === Interface_1.CustomMcpServerAuthType.CUSTOM_HEADERS) {
                    assertValidHeaders(requestBody.authConfig.headers);
                }
                requestBody.authConfig = await (0, utils_2.encryptCredentialData)(requestBody.authConfig);
            }
            else {
                requestBody.authConfig = null; // explicitly set to null to avoid saving non-decrypted values or empty objects/strings in the database
            }
        }
        Object.assign(newRecord, requestBody);
        const record = appServer.AppDataSource.getRepository(CustomMcpServer_1.CustomMcpServer).create(newRecord);
        const dbResponse = await appServer.AppDataSource.getRepository(CustomMcpServer_1.CustomMcpServer).save(record);
        await appServer.telemetry.sendTelemetry('custom_mcp_server_created', {
            version: await (0, utils_3.getAppVersion)(),
            toolId: dbResponse.id,
            toolName: dbResponse.name
        }, orgId);
        appServer.metricsProvider?.incrementCounter(Interface_Metrics_1.ACCELANCE_METRIC_COUNTERS.CUSTOM_MCP_SERVER_CREATED, {
            status: Interface_Metrics_1.ACCELANCE_COUNTER_STATUS.SUCCESS
        });
        return sanitizeCustomMcpServer(dbResponse);
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError)
            throw error;
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: customMcpServersService.createCustomMcpServer - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getAllCustomMcpServers = async (workspaceId, page = -1, limit = -1) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const queryBuilder = appServer.AppDataSource.getRepository(CustomMcpServer_1.CustomMcpServer)
            .createQueryBuilder('custom_mcp_server')
            .orderBy('custom_mcp_server.updatedDate', 'DESC');
        queryBuilder.andWhere('custom_mcp_server.workspaceId = :workspaceId', { workspaceId });
        if (page > 0 && limit > 0) {
            queryBuilder.skip((page - 1) * limit);
            queryBuilder.take(limit);
        }
        const [data, total] = await queryBuilder.getManyAndCount();
        const sanitized = data.map(sanitizeCustomMcpServer);
        if (page > 0 && limit > 0) {
            return { data: sanitized, total };
        }
        else {
            return sanitized;
        }
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: customMcpServersService.getAllCustomMcpServers - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getCustomMcpServerById = async (id, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        // Explicitly select `tools` — it is `select: false` on the entity so list queries stay cheap.
        const dbResponse = await appServer.AppDataSource.getRepository(CustomMcpServer_1.CustomMcpServer)
            .createQueryBuilder('custom_mcp_server')
            .addSelect('custom_mcp_server.tools')
            .where('custom_mcp_server.id = :id', { id })
            .andWhere('custom_mcp_server.workspaceId = :workspaceId', { workspaceId })
            .getOne();
        if (!dbResponse) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Custom MCP server ${id} not found`);
        }
        const result = {
            ...dbResponse,
            authConfig: undefined,
            env: undefined,
            serverUrl: dbResponse.serverUrl ? maskServerUrl(dbResponse.serverUrl) : undefined
        };
        if (dbResponse.env) {
            try {
                const decryptedEnv = await (0, utils_2.decryptCredentialData)(dbResponse.env);
                result.env = decryptedEnv && typeof decryptedEnv === 'object' ? maskEnv(decryptedEnv) : {};
            }
            catch {
                result.env = {};
            }
        }
        if (dbResponse.authConfig) {
            try {
                const decrypted = await (0, utils_2.decryptCredentialData)(dbResponse.authConfig);
                if (decrypted && typeof decrypted === 'object') {
                    // Mask sensitive header values — only expose keys
                    const masked = { ...decrypted };
                    if (masked.headers && typeof masked.headers === 'object') {
                        const redactedHeaders = {};
                        for (const key of Object.keys(masked.headers)) {
                            redactedHeaders[key] = REDACTED_VALUE;
                        }
                        masked.headers = redactedHeaders;
                    }
                    result.authConfig = masked;
                }
                else {
                    result.authConfig = {};
                }
            }
            catch {
                result.authConfig = {};
            }
        }
        return result;
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError)
            throw error;
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: customMcpServersService.getCustomMcpServerById - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const updateCustomMcpServer = async (id, requestBody, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const record = await appServer.AppDataSource.getRepository(CustomMcpServer_1.CustomMcpServer).findOneBy({
            id,
            workspaceId
        });
        if (!record) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Custom MCP server ${id} not found`);
        }
        const targetTransportType = requestBody.transportType || record.transportType || Interface_1.CustomMcpServerTransportType.URL;
        if (targetTransportType === Interface_1.CustomMcpServerTransportType.STDIO) {
            const command = requestBody.command ?? record.command;
            const args = requestBody.args !== undefined ? requestBody.args : record.args ? JSON.parse(record.args) : [];
            assertValidStdioConfig(command, args, requestBody.env && typeof requestBody.env === 'object' ? requestBody.env : undefined);
            requestBody.command = command;
            requestBody.args = JSON.stringify(Array.isArray(args) ? args : []);
            requestBody.serverUrl = null;
            requestBody.authType = Interface_1.CustomMcpServerAuthType.NONE;
            requestBody.authConfig = null;
            if (requestBody.env && typeof requestBody.env === 'object') {
                let mergedEnv = { ...requestBody.env };
                if (record.env) {
                    try {
                        const existingEnv = (await (0, utils_2.decryptCredentialData)(record.env));
                        mergedEnv = {};
                        for (const [key, value] of Object.entries(requestBody.env)) {
                            mergedEnv[key] = value === REDACTED_VALUE && key in existingEnv ? existingEnv[key] : value;
                        }
                    }
                    catch {
                        // existing env couldn't be decrypted — fall back to whatever the client sent
                    }
                }
                requestBody.env = await (0, utils_2.encryptCredentialData)(mergedEnv);
            }
        }
        else {
            requestBody.transportType = Interface_1.CustomMcpServerTransportType.URL;
            requestBody.command = null;
            requestBody.args = null;
            requestBody.env = null;
            if (record.serverUrl && requestBody.serverUrl === maskServerUrl(record.serverUrl)) {
                requestBody.serverUrl = record.serverUrl;
            }
            else if (requestBody.serverUrl && requestBody.serverUrl.includes(REDACTED_VALUE)) {
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Server URL still contains the masked placeholder. Send the full URL, or omit serverUrl from the request to keep the existing value.');
            }
            else if (requestBody.serverUrl) {
                await assertSafeServerUrl(requestBody.serverUrl);
            }
        }
        // Merge authConfig: clear it when switching to no authentication; otherwise preserve
        // existing encrypted header values when client sends redacted placeholders
        if (targetTransportType === Interface_1.CustomMcpServerTransportType.STDIO) {
            // handled above
        }
        else if (requestBody.authType === Interface_1.CustomMcpServerAuthType.NONE) {
            requestBody.authConfig = null;
        }
        else if (requestBody.authConfig && typeof requestBody.authConfig === 'object') {
            if (requestBody.authConfig.headers && typeof requestBody.authConfig.headers === 'object' && record.authConfig) {
                try {
                    const existingDecrypted = await (0, utils_2.decryptCredentialData)(record.authConfig);
                    if (existingDecrypted?.headers && typeof existingDecrypted.headers === 'object') {
                        const mergedHeaders = {};
                        for (const [key, value] of Object.entries(requestBody.authConfig.headers)) {
                            // Keep existing value if client sent the redacted placeholder
                            if (value === REDACTED_VALUE && key in existingDecrypted.headers) {
                                mergedHeaders[key] = existingDecrypted.headers[key];
                            }
                            else if (typeof value === 'string' && value !== REDACTED_VALUE && value.includes(REDACTED_VALUE)) {
                                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Header "${key}" value still contains the masked placeholder. Send the full value, or pass "${REDACTED_VALUE}" to keep the existing value.`);
                            }
                            else {
                                mergedHeaders[key] = value;
                            }
                        }
                        requestBody.authConfig = { ...requestBody.authConfig, headers: mergedHeaders };
                    }
                }
                catch (err) {
                    if (err instanceof internalAccelanceError_1.InternalAccelanceError)
                        throw err;
                }
            }
            if (requestBody.authType === Interface_1.CustomMcpServerAuthType.CUSTOM_HEADERS) {
                assertValidHeaders(requestBody.authConfig.headers);
            }
            requestBody.authConfig = await (0, utils_2.encryptCredentialData)(requestBody.authConfig);
        }
        const updateRecord = new CustomMcpServer_1.CustomMcpServer();
        Object.assign(updateRecord, requestBody);
        appServer.AppDataSource.getRepository(CustomMcpServer_1.CustomMcpServer).merge(record, updateRecord);
        record.workspaceId = workspaceId; // defense-in-depth
        const dbResponse = await appServer.AppDataSource.getRepository(CustomMcpServer_1.CustomMcpServer).save(record);
        return sanitizeCustomMcpServer(dbResponse);
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError)
            throw error;
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: customMcpServersService.updateCustomMcpServer - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const deleteCustomMcpServer = async (id, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dbResponse = await appServer.AppDataSource.getRepository(CustomMcpServer_1.CustomMcpServer).delete({
            id,
            workspaceId
        });
        return dbResponse;
    }
    catch (error) {
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: customMcpServersService.deleteCustomMcpServer - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const authorizeCustomMcpServer = async (id, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const repo = appServer.AppDataSource.getRepository(CustomMcpServer_1.CustomMcpServer);
        const record = await repo.findOneBy({ id, workspaceId });
        if (!record) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Custom MCP server ${id} not found`);
        }
        let toolkit = null;
        try {
            let serverParams;
            let transport;
            if (record.transportType === Interface_1.CustomMcpServerTransportType.STDIO) {
                const args = record.args ? JSON.parse(record.args) : [];
                let env;
                if (record.env) {
                    try {
                        env = (await (0, utils_2.decryptCredentialData)(record.env));
                    }
                    catch {
                        // env decryption failed — launch without it
                    }
                }
                // Re-validate at authorize time too (defense in depth), not just at save time.
                (0, accelance_components_1.validateMCPServerConfig)({ command: record.command, args, env });
                serverParams = { command: record.command, args, ...(env ? { env } : {}) };
                transport = 'stdio';
            }
            else {
                // Build headers from decrypted authConfig — only when authType explicitly requires them
                let headers = {};
                if (record.authType === Interface_1.CustomMcpServerAuthType.CUSTOM_HEADERS && record.authConfig) {
                    try {
                        const decrypted = await (0, utils_2.decryptCredentialData)(record.authConfig);
                        if (decrypted && typeof decrypted === 'object') {
                            // Support CUSTOM_HEADERS format: { headers: { key: value } }
                            if (decrypted.headers && typeof decrypted.headers === 'object') {
                                headers = decrypted.headers;
                            }
                        }
                    }
                    catch {
                        // authConfig decryption failed — proceed without headers
                    }
                }
                serverParams = {
                    url: record.serverUrl,
                    ...(Object.keys(headers).length > 0 ? { headers } : {})
                };
                transport = 'sse';
            }
            toolkit = new accelance_components_1.MCPToolkit(serverParams, transport);
            const timeoutMs = getAuthorizeTimeoutMs();
            await withTimeout(toolkit.initialize(), timeoutMs, `MCP server handshake exceeded ${timeoutMs}ms`);
            const discoveredTools = toolkit._tools || [];
            const toolsJson = JSON.stringify(discoveredTools);
            const maxBytes = getToolsMaxBytes();
            if (maxBytes > 0 && Buffer.byteLength(toolsJson, 'utf8') > maxBytes) {
                record.status = Interface_1.CustomMcpServerStatus.ERROR;
                await repo.save(record);
                throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `MCP server returned a tools payload larger than the allowed limit (${maxBytes} bytes). Set CUSTOM_MCP_TOOLS_MAX_BYTES to override.`);
            }
            const toolsArray = Array.isArray(discoveredTools?.tools) ? discoveredTools.tools : [];
            record.tools = toolsJson;
            record.toolCount = toolsArray.length;
            record.status = Interface_1.CustomMcpServerStatus.AUTHORIZED;
            await repo.save(record);
            logger_1.default.debug(`[CustomMcpServerService]: Authorized Custom MCP server ${id}, discovered ${toolsArray.length} tools`);
            // Ensure tools is present in the response even if `select:false` stripped it from the saved entity.
            return { ...sanitizeCustomMcpServer(record), tools: toolsJson };
        }
        catch (connectError) {
            // InternalAccelanceError (e.g. oversized tools payload) was already persisted — rethrow as-is
            if (connectError instanceof internalAccelanceError_1.InternalAccelanceError)
                throw connectError;
            record.status = Interface_1.CustomMcpServerStatus.ERROR;
            await repo.save(record);
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.BAD_REQUEST, `Failed to connect to Custom MCP server: ${(0, utils_1.getErrorMessage)(connectError)}`);
        }
        finally {
            if (toolkit?.client) {
                try {
                    await toolkit.client.close();
                }
                catch {
                    // ignore cleanup errors
                }
            }
        }
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError)
            throw error;
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: customMcpServersService.authorizeCustomMcpServer - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getDiscoveredTools = async (id, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const record = await appServer.AppDataSource.getRepository(CustomMcpServer_1.CustomMcpServer)
            .createQueryBuilder('custom_mcp_server')
            .addSelect('custom_mcp_server.tools')
            .where('custom_mcp_server.id = :id', { id })
            .andWhere('custom_mcp_server.workspaceId = :workspaceId', { workspaceId })
            .getOne();
        if (!record) {
            throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.NOT_FOUND, `Custom MCP server ${id} not found`);
        }
        if (!record.tools) {
            return [];
        }
        try {
            const parsed = JSON.parse(record.tools);
            return Array.isArray(parsed?.tools) ? parsed.tools : [];
        }
        catch {
            return [];
        }
    }
    catch (error) {
        if (error instanceof internalAccelanceError_1.InternalAccelanceError)
            throw error;
        throw new internalAccelanceError_1.InternalAccelanceError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: customMcpServersService.getDiscoveredTools - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    createCustomMcpServer,
    getAllCustomMcpServers,
    getCustomMcpServerById,
    updateCustomMcpServer,
    deleteCustomMcpServer,
    authorizeCustomMcpServer,
    getDiscoveredTools
};
//# sourceMappingURL=index.js.map