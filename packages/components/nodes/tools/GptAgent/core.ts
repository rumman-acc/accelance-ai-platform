import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to delegate a question or task to GPT as a callable sub-agent`

export interface Headers {
    [key: string]: string
}

export interface Body {
    [key: string]: any
}

export interface RequestParameters {
    model?: string
    apiKey?: string
    maxOutputLength?: number
}

const AskGptSchema = z.object({
    prompt: z.string().describe('The question or task to send to GPT'),
    systemPrompt: z.string().optional().describe('Optional system prompt to set context/persona')
})

class BaseGptAgentTool extends DynamicStructuredTool {
    protected model: string = 'gpt-4o'
    protected apiKey: string = ''

    constructor(args: any) {
        super(args)
        this.model = args.model ?? 'gpt-4o'
        this.apiKey = args.apiKey ?? ''
    }

    async makeGptRequest({ body, params }: { body: any; params?: any }): Promise<string> {
        const url = 'https://api.openai.com/v1/chat/completions'

        const headers = {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            ...this.headers
        }

        const fetchOptions: any = {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        }

        const response = await secureFetch(url, fetchOptions, 5)

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`OpenAI API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.json()
        const answer = data?.choices?.[0]?.message?.content ?? ''
        return answer + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class AskGptTool extends BaseGptAgentTool {
    constructor(args: any) {
        const toolInput = {
            name: 'ask_gpt',
            description: 'Delegate a question or task to GPT and receive its answer',
            schema: AskGptSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            model: args.model,
            apiKey: args.apiKey,
            maxOutputLength: args.maxOutputLength
        })
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg }

        try {
            const messages: any[] = []
            if (params.systemPrompt) {
                messages.push({ role: 'system', content: params.systemPrompt })
            }
            messages.push({ role: 'user', content: params.prompt })

            const body = {
                model: this.model,
                messages
            }

            const response = await this.makeGptRequest({ body, params })
            return response
        } catch (error) {
            return formatToolError(`Error asking GPT: ${error}`, params)
        }
    }
}

export const createGptAgentTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const model = args?.model || 'gpt-4o'
    const apiKey = args?.apiKey || ''
    const maxOutputLength = args?.maxOutputLength || Infinity

    tools.push(
        new AskGptTool({
            model,
            apiKey,
            maxOutputLength
        })
    )

    return tools
}
