import { BaseToolkit, Tool } from '@langchain/core/tools';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport, StdioServerParameters } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ListToolsResult } from '@modelcontextprotocol/sdk/types.js';
export declare class MCPToolkit extends BaseToolkit {
    tools: Tool[];
    _tools: ListToolsResult | null;
    model_config: any;
    transport: StdioClientTransport | SSEClientTransport | StreamableHTTPClientTransport | null;
    client: Client | null;
    serverParams: StdioServerParameters | any;
    transportType: 'stdio' | 'sse' | 'http';
    /** Per-invocation HTTP headers injected at tools/call time; overrides static toolkit headers for the same names. */
    getToolCallHeaders?: () => Promise<Record<string, string>>;
    constructor(serverParams: StdioServerParameters | any, transportType: 'stdio' | 'sse' | 'http');
    /**
     * Creates a new MCP client and connects it via the configured transport.
     * @param injectHeaders - Additional HTTP headers merged over static `serverParams.headers` for this connection. Used to pass per-invocation headers (e.g. from {@link getToolCallHeaders}) into SSE/HTTP transports.
     */
    createClient(injectHeaders?: Record<string, string>): Promise<Client>;
    initialize(): Promise<void>;
    get_tools(): Promise<Tool[]>;
}
export declare function MCPTool({ toolkit, name, description, argsSchema }: {
    toolkit: MCPToolkit;
    name: string;
    description: string;
    argsSchema: any;
}): Promise<Tool>;
export declare const validateArgsForLocalFileAccess: (args: string[]) => void;
export declare const validateCommandInjection: (args: string[]) => void;
/**
 * Validates user-supplied env vars against the operator-controlled allow-list in
 * `CUSTOM_MCP_ALLOWED_ENV_VARS` (comma-separated names). Empty = none allowed.
 */
export declare const validateEnvironmentVariables: (env: Record<string, any>) => void;
/**
 * Validates that command arguments don't contain flags that enable arbitrary code execution
 * This prevents attacks where whitelisted commands are used with dangerous flags
 * (e.g., "npx -c malicious-command" or "python -c malicious-code")
 * @param command The command to validate
 * @param args The arguments to validate
 */
export declare const validateCommandFlags: (command: string, args: string[]) => void;
export declare const validateMCPServerConfig: (serverParams: any) => void;
