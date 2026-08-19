'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.validateMCPServerConfig =
    exports.validateCommandFlags =
    exports.validateEnvironmentVariables =
    exports.validateCommandInjection =
    exports.validateArgsForLocalFileAccess =
    exports.MCPToolkit =
        void 0
exports.MCPTool = MCPTool
const tools_1 = require('@langchain/core/tools')
const index_js_1 = require('@modelcontextprotocol/sdk/client/index.js')
const sse_js_1 = require('@modelcontextprotocol/sdk/client/sse.js')
const stdio_js_1 = require('@modelcontextprotocol/sdk/client/stdio.js')
const streamableHttp_js_1 = require('@modelcontextprotocol/sdk/client/streamableHttp.js')
const types_js_1 = require('@modelcontextprotocol/sdk/types.js')
const httpSecurity_1 = require('../../../src/httpSecurity')
class MCPToolkit extends tools_1.BaseToolkit {
    constructor(serverParams, transportType) {
        super()
        this.tools = []
        this._tools = null
        this.transport = null
        this.client = null
        this.serverParams = serverParams
        this.transportType = transportType
    }
    /**
     * Creates a new MCP client and connects it via the configured transport.
     * @param injectHeaders - Additional HTTP headers merged over static `serverParams.headers` for this connection. Used to pass per-invocation headers (e.g. from {@link getToolCallHeaders}) into SSE/HTTP transports.
     */
    async createClient(injectHeaders = {}) {
        const client = new index_js_1.Client(
            {
                name: 'flowise-client',
                version: '1.0.0'
            },
            {
                capabilities: {}
            }
        )
        let transport
        if (this.transportType === 'stdio') {
            // Compatible with overridden PATH configuration
            const params = {
                ...this.serverParams,
                env: {
                    ...(this.serverParams.env || {}),
                    PATH: process.env.PATH
                }
            }
            transport = new stdio_js_1.StdioClientTransport(params)
            await client.connect(transport)
        } else {
            if (this.serverParams.url === undefined) {
                throw new Error('URL is required for SSE transport')
            }
            const baseUrl = new URL(this.serverParams.url)
            await (0, httpSecurity_1.checkDenyList)(this.serverParams.url)
            const mergedHeaders = { ...this.serverParams?.headers, ...injectHeaders }
            const headers = Object.keys(mergedHeaders).length > 0 ? mergedHeaders : undefined
            try {
                if (headers) {
                    transport = new streamableHttp_js_1.StreamableHTTPClientTransport(baseUrl, {
                        requestInit: {
                            headers
                        }
                    })
                } else {
                    transport = new streamableHttp_js_1.StreamableHTTPClientTransport(baseUrl)
                }
                await client.connect(transport)
            } catch (error) {
                console.error('Error connecting to MCP server', error)
                if (headers) {
                    transport = new sse_js_1.SSEClientTransport(baseUrl, {
                        requestInit: {
                            headers
                        },
                        eventSourceInit: {
                            fetch: async (url, init) => {
                                return (0, httpSecurity_1.secureFetch)(url.toString(), {
                                    ...init,
                                    headers
                                })
                            }
                        }
                    })
                } else {
                    transport = new sse_js_1.SSEClientTransport(baseUrl, {
                        eventSourceInit: {
                            fetch: async (url, init) => {
                                return (0, httpSecurity_1.secureFetch)(url.toString(), init)
                            }
                        }
                    })
                }
                await client.connect(transport)
            }
        }
        return client
    }
    async initialize() {
        if (this._tools === null) {
            this.client = await this.createClient()
            this._tools = await this.client.request({ method: 'tools/list' }, types_js_1.ListToolsResultSchema)
            this.tools = await this.get_tools()
            // Close the initial client after initialization
            await this.client.close()
        }
    }
    async get_tools() {
        if (this._tools === null || this.client === null) {
            throw new Error('Must initialize the toolkit first')
        }
        const toolsPromises = this._tools.tools.map(async (tool) => {
            if (this.client === null) {
                throw new Error('Client is not initialized')
            }
            const argsSchema = tool.inputSchema ?? { type: 'object', properties: {} }
            return await MCPTool({
                toolkit: this,
                name: tool.name,
                description: tool.description || tool.name,
                argsSchema
            })
        })
        const res = await Promise.allSettled(toolsPromises)
        const errors = res.filter((r) => r.status === 'rejected')
        if (errors.length !== 0) {
            console.error('MCP Tools failed to be resolved', errors)
        }
        const successes = res.filter((r) => r.status === 'fulfilled').map((r) => r.value)
        return successes
    }
}
exports.MCPToolkit = MCPToolkit
async function MCPTool({ toolkit, name, description, argsSchema }) {
    return (0, tools_1.tool)(
        async (input) => {
            // Create a new client for this request
            const toolCallHeaders = await toolkit.getToolCallHeaders?.()
            const client = await toolkit.createClient(toolCallHeaders)
            try {
                const req = { method: 'tools/call', params: { name: name, arguments: input } }
                const res = await client.request(req, types_js_1.CallToolResultSchema)
                const content = res.content
                const contentString = JSON.stringify(content)
                return contentString
            } finally {
                // Always close the client after the request completes
                await client.close()
            }
        },
        {
            name: name,
            description: description,
            schema: argsSchema
        }
    )
}
const validateArgsForLocalFileAccess = (args) => {
    const dangerousPatterns = [
        // Absolute paths
        /^\//, // Unix absolute paths starting with /
        /^[a-zA-Z]:\\/, // Windows absolute paths like C:\
        // Relative paths that could escape current directory
        /\.\.\//, // Parent directory traversal with ../
        /\.\.\\/, // Parent directory traversal with ..\
        /^\.\./, // Starting with ..
        // Local file access patterns
        /^\.\//, // Current directory with ./
        /^~\//, // Home directory with ~/
        /^file:\/\//, // File protocol
        // Common file extensions that shouldn't be accessed
        /\.(exe|bat|cmd|sh|ps1|vbs|scr|com|pif|dll|sys)$/i,
        // File flags and options that could access local files
        /^--?(?:file|input|output|config|load|save|import|export|read|write)=/i,
        /^--?(?:file|input|output|config|load|save|import|export|read|write)$/i
    ]
    for (const arg of args) {
        if (typeof arg !== 'string') continue
        // Check for dangerous patterns
        for (const pattern of dangerousPatterns) {
            if (pattern.test(arg)) {
                throw new Error(`Argument contains potential local file access: "${arg}"`)
            }
        }
        // Check for null bytes
        if (arg.includes('\0')) {
            throw new Error(`Argument contains null byte: "${arg}"`)
        }
        // Check for very long paths that might be used for buffer overflow attacks
        if (arg.length > 1000) {
            throw new Error(`Argument is suspiciously long (${arg.length} characters): "${arg.substring(0, 100)}..."`)
        }
    }
}
exports.validateArgsForLocalFileAccess = validateArgsForLocalFileAccess
const validateCommandInjection = (args) => {
    const dangerousPatterns = [
        // Shell metacharacters
        /[;&|`$(){}[\]<>]/,
        // Command chaining
        /&&|\|\||;;/,
        // Redirections
        />>|<<|>/,
        // Backticks and command substitution
        /`|\$\(/,
        // Process substitution
        /<\(|>\(/
    ]
    for (const arg of args) {
        if (typeof arg !== 'string') continue
        for (const pattern of dangerousPatterns) {
            if (pattern.test(arg)) {
                throw new Error(`Argument contains potentially dangerous characters: "${arg}"`)
            }
        }
    }
}
exports.validateCommandInjection = validateCommandInjection
/**
 * Validates user-supplied env vars against the operator-controlled allow-list in
 * `CUSTOM_MCP_ALLOWED_ENV_VARS` (comma-separated names). Empty = none allowed.
 */
const validateEnvironmentVariables = (env) => {
    const allowedEnvVars = new Set(
        (process.env.CUSTOM_MCP_ALLOWED_ENV_VARS ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
    )
    for (const [key, value] of Object.entries(env)) {
        if (!allowedEnvVars.has(key)) {
            throw new Error(`Environment variable '${key}' is not allowed. Permitted: ${[...allowedEnvVars].join(', ') || '(none)'}`)
        }
        if (typeof value === 'string' && value.includes('\0')) {
            throw new Error(`Environment variable '${key}' contains null byte`)
        }
    }
}
exports.validateEnvironmentVariables = validateEnvironmentVariables
/**
 * Validates that command arguments don't contain flags that enable arbitrary code execution
 * This prevents attacks where whitelisted commands are used with dangerous flags
 * (e.g., "npx -c malicious-command" or "python -c malicious-code")
 * @param command The command to validate
 * @param args The arguments to validate
 */
const validateCommandFlags = (command, args) => {
    // Define dangerous flags for each command that enable code execution
    const dangerousFlagsByCommand = {
        npx: [
            '-c', // Execute shell commands
            '--call', // Execute shell commands
            '--shell-auto-fallback', // Shell execution fallback
            '--node-options' // Passes arbitrary Node flags to underlying process, bypassing node flag blocklist
        ],
        // '-y'/'--yes' (auto-confirm the install prompt) is intentionally NOT blocked: it only skips an
        // interactive confirmation that a non-interactive spawned process can't answer anyway, it doesn't
        // enable code execution beyond what launching the named package already does. Nearly every real-world
        // community MCP server's documented launch command is exactly `npx -y <package>` -- blocking it made
        // `npx` unusable in practice while providing no actual security benefit over the flags above.
        uvx: [],
        node: [
            '-e', // Execute JavaScript code
            '--eval', // Execute JavaScript code
            '-p', // Evaluate and print JavaScript code
            '--print', // Evaluate and print JavaScript code
            '--inspect', // Enable remote debugging (security risk)
            '--inspect-brk', // Enable remote debugging with breakpoint (security risk)
            '--experimental-policy', // Could load malicious policies
            '-r', // Short alias for --require
            '--require', // Preload a CommonJS module before script runs
            '--loader', // Custom ES module loader hook (code execution)
            '--experimental-loader', // Same as --loader, older Node alias
            '--import', // Preload ESM module before entry script (Node 18+)
            '--env-file' // Read env vars from a local file (Node 20+, local file access)
        ],
        python: [
            '-c', // Execute Python code
            '-m' // Run library modules (could run malicious modules)
        ],
        python3: [
            '-c', // Execute Python code
            '-m' // Run library modules (could run malicious modules)
        ],
        docker: [
            'run', // Run containers (too powerful)
            'build', // Pulls a container and executes the run instructions
            'exec', // Execute in containers
            'compose', // Subcommand that starts containers (same risk as run)
            '-v', // Mount host filesystems
            '--volume', // Mount host filesystems
            '--mount', // Alternative to -v/--volume for mounting host paths
            '--volumes-from', // Mount volumes from another container (filesystem access)
            '--privileged', // Privileged mode
            '--cap-add', // Add capabilities
            '--security-opt', // Modify security options
            '--device', // Add host device files to container (privilege escalation)
            '--entrypoint', // Override container entrypoint (arbitrary code execution)
            '--network', // Host network access (catches --network=host and --network host)
            '--pid', // Host PID namespace (catches --pid=host and --pid host)
            '--ipc', // Host IPC namespace (catches --ipc=host and --ipc host)
            '--env-file' // Read env vars from a local host file (local file access)
        ]
    }
    const dangerousFlags = dangerousFlagsByCommand[command] || []
    // Collect single-char dangerous flags (e.g. '-c' -> 'c') for combined flag detection
    const dangerousShortChars = new Set(dangerousFlags.filter((f) => /^-[a-zA-Z]$/.test(f)).map((f) => f[1].toLowerCase()))
    for (const arg of args) {
        if (typeof arg !== 'string') continue
        const normalizedArg = arg.toLowerCase().trim()
        // Check for dangerous flags in various forms (exact, =value, space-separated value)
        for (const flag of dangerousFlags) {
            const lowerCaseFlag = flag.toLowerCase()
            if (normalizedArg === lowerCaseFlag) {
                throw new Error(`Argument '${arg}' is not allowed for command '${command}'.`)
            }
            if (normalizedArg.startsWith(lowerCaseFlag + '=')) {
                throw new Error(`Argument '${arg}' contains flag '${flag}' that is not allowed for command '${command}'.`)
            }
            if (flag.startsWith('-') && normalizedArg.startsWith(lowerCaseFlag + ' ')) {
                throw new Error(`Argument '${arg}' contains flag '${flag}' that is not allowed for command '${command}'.`)
            }
        }
        // Check for combined short flags (e.g. "-yc" = "-y" + "-c")
        // A combined flag starts with a single '-', is not a long flag '--', and has multiple characters after '-'
        if (/^-[a-zA-Z]{2,}/.test(normalizedArg)) {
            const flagChars = normalizedArg.slice(1) // strip leading '-'
            for (const ch of flagChars) {
                if (dangerousShortChars.has(ch)) {
                    throw new Error(`Argument '${arg}' contains dangerous flag '-${ch}' for command '${command}'.`)
                }
            }
        }
    }
}
exports.validateCommandFlags = validateCommandFlags
const validateMCPServerConfig = (serverParams) => {
    // Validate the entire server configuration
    if (!serverParams || typeof serverParams !== 'object') {
        throw new Error('Invalid server configuration')
    }
    // Command allowlist - only allow specific safe commands
    const allowedCommands = ['node', 'npx', 'python', 'python3', 'docker', 'uvx']
    if (serverParams.command && !allowedCommands.includes(serverParams.command)) {
        throw new Error(`Command '${serverParams.command}' is not allowed. Allowed commands: ${allowedCommands.join(', ')}`)
    }
    // Validate arguments if present
    if (serverParams.args && Array.isArray(serverParams.args)) {
        ;(0, exports.validateArgsForLocalFileAccess)(serverParams.args)
        ;(0, exports.validateCommandInjection)(serverParams.args)
        // Validate command-specific dangerous flags
        if (serverParams.command) {
            ;(0, exports.validateCommandFlags)(serverParams.command, serverParams.args)
        }
    }
    // Validate environment variables
    if (serverParams.env) {
        ;(0, exports.validateEnvironmentVariables)(serverParams.env)
    }
}
exports.validateMCPServerConfig = validateMCPServerConfig
//# sourceMappingURL=core.js.map
