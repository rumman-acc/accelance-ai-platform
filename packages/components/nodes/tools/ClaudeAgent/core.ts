import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this to delegate a step to Claude as a callable sub-agent from within a flow`

export interface Headers {
    [key: string]: string
}

export interface Body {
    [key: string]: any
}

export interface RequestParameters {
    headers?: Headers
    body?: Body
    url?: string
    description?: string
    maxOutputLength?: number
    name?: string
    model?: string
    maxTokens?: number
    apiKey?: string
}

const AskClaudeSchema = z.object({
    prompt: z.string().describe('The question or task to send to Claude'),
    systemPrompt: z.string().optional().describe('Optional system prompt to set context/persona')
})

const ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1'
const ANTHROPIC_VERSION = '2023-06-01'

class BaseClaudeAgentTool extends DynamicStructuredTool {
    protected model: string = 'claude-sonnet-4-5-20250929'
    protected maxTokens: number = 1024
    protected apiKey: string = ''

    constructor(args: any) {
        super(args)
        this.model = args.model ?? this.model
        this.maxTokens = args.maxTokens ?? this.maxTokens
        this.apiKey = args.apiKey ?? ''
    }

    async makeClaudeRequest({ body, params }: { body: Body; params?: any }): Promise<string> {
        const url = `${ANTHROPIC_BASE_URL}/messages`

        const headers = {
            'x-api-key': this.apiKey,
            'anthropic-version': ANTHROPIC_VERSION,
            'Content-Type': 'application/json',
            ...this.headers
        }

        const fetchOptions: any = {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        }

        const response = await secureFetch(url, fetchOptions)

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Anthropic API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.json()
        const content = Array.isArray(data?.content) ? data.content : []
        const text = content
            .filter((block: any) => block && block.type === 'text' && typeof block.text === 'string')
            .map((block: any) => block.text)
            .join('')

        return text + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class AskClaudeTool extends BaseClaudeAgentTool {
    constructor(args: any) {
        const toolInput = {
            name: 'ask_claude',
            description: 'Delegate a step to Claude as a callable sub-agent from within a flow',
            schema: AskClaudeSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            model: args.model,
            maxTokens: args.maxTokens,
            apiKey: args.apiKey,
            maxOutputLength: args.maxOutputLength
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const body: Body = {
                model: this.model,
                max_tokens: this.maxTokens,
                messages: [{ role: 'user', content: params.prompt }],
                ...(params.systemPrompt ? { system: params.systemPrompt } : {})
            }

            const response = await this.makeClaudeRequest({ body, params })
            return response
        } catch (error) {
            return formatToolError(`Error calling Claude: ${error}`, params)
        }
    }
}

export const createClaudeAgentTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const model = args?.model || 'claude-sonnet-4-5-20250929'
    const maxTokens = args?.maxTokens || 1024
    const apiKey = args?.apiKey || ''
    const maxOutputLength = args?.maxOutputLength || Infinity

    tools.push(
        new AskClaudeTool({
            model,
            maxTokens,
            apiKey,
            maxOutputLength
        })
    )

    return tools
}
