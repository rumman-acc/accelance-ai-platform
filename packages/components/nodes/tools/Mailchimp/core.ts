import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { TOOL_ARGS_PREFIX, formatToolError } from '../../../src/agents'
import { secureFetch } from '../../../src/httpSecurity'

export const desc = `Use this when you want to access Mailchimp API for managing audiences and campaigns`

export interface Headers {
    [key: string]: string
}

export interface Body {
    [key: string]: any
}

export interface MailchimpAuthConfig {
    apiKey: string
}

export interface RequestParameters {
    headers?: Headers
    body?: Body
    url?: string
    description?: string
    maxOutputLength?: number
    name?: string
    actions?: string[]
    apiKey?: string
    defaultParams?: any
    authConfig?: MailchimpAuthConfig
}

// Define schemas for different Mailchimp operations
const ListAudiencesSchema = z.object({})

const AddListMemberSchema = z.object({
    listId: z.string().describe('ID of the audience/list to add the member to'),
    email: z.string().describe('Email address of the member to add')
})

const GetListMemberSchema = z.object({
    listId: z.string().describe('ID of the audience/list'),
    subscriberHash: z.string().describe('MD5 hash of the lowercased email address')
})

const ListCampaignsSchema = z.object({})

const CreateCampaignSchema = z.object({
    listId: z.string().describe('ID of the audience/list to send the campaign to'),
    subjectLine: z.string().describe('Subject line of the campaign email'),
    fromName: z.string().describe('Name the campaign is sent from'),
    replyTo: z.string().describe('Reply-to email address for the campaign')
})

class BaseMailchimpTool extends DynamicStructuredTool {
    protected apiKey: string = ''
    protected authConfig: MailchimpAuthConfig | undefined

    constructor(args: any) {
        super(args)
        this.apiKey = args.apiKey ?? ''
        this.authConfig = args.authConfig
    }

    async makeMailchimpRequest({
        endpoint,
        method = 'GET',
        body,
        params
    }: {
        endpoint: string
        method?: string
        body?: any
        params?: any
    }): Promise<string> {
        const apiKey = this.authConfig?.apiKey ?? this.apiKey
        const dc = apiKey.split('-').pop()
        const baseUrl = `https://${dc}.api.mailchimp.com/3.0`
        const url = `${baseUrl}${endpoint}`

        const auth = Buffer.from(`anystring:${apiKey}`).toString('base64')

        const headers = {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
            ...this.headers
        }

        const fetchOptions: any = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        }

        const response = await secureFetch(url, fetchOptions, 5)

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Mailchimp API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }

        const data = await response.text()
        return data + TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}

class ListAudiencesTool extends BaseMailchimpTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_audiences',
            description: 'List all audiences (lists) in the Mailchimp account',
            schema: ListAudiencesSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const response = await this.makeMailchimpRequest({ endpoint: '/lists', params })
            return response
        } catch (error) {
            return formatToolError(`Error listing audiences: ${error}`, params)
        }
    }
}

class AddListMemberTool extends BaseMailchimpTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'add_list_member',
            description: 'Add a new member to a Mailchimp audience/list',
            schema: AddListMemberSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const body = {
                email_address: params.email,
                status: 'subscribed'
            }
            const endpoint = `/lists/${params.listId}/members`
            const response = await this.makeMailchimpRequest({ endpoint, method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error adding list member: ${error}`, params)
        }
    }
}

class GetListMemberTool extends BaseMailchimpTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'get_list_member',
            description: 'Get a specific member of a Mailchimp audience/list',
            schema: GetListMemberSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const endpoint = `/lists/${params.listId}/members/${params.subscriberHash}`
            const response = await this.makeMailchimpRequest({ endpoint, params })
            return response
        } catch (error) {
            return formatToolError(`Error getting list member: ${error}`, params)
        }
    }
}

class ListCampaignsTool extends BaseMailchimpTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'list_campaigns',
            description: 'List campaigns in the Mailchimp account',
            schema: ListCampaignsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const response = await this.makeMailchimpRequest({ endpoint: '/campaigns', params })
            return response
        } catch (error) {
            return formatToolError(`Error listing campaigns: ${error}`, params)
        }
    }
}

class CreateCampaignTool extends BaseMailchimpTool {
    defaultParams: any

    constructor(args: any) {
        const toolInput = {
            name: 'create_campaign',
            description: 'Create a new regular email campaign in Mailchimp',
            schema: CreateCampaignSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            apiKey: args.apiKey,
            maxOutputLength: args.maxOutputLength,
            authConfig: args.authConfig
        })
        this.defaultParams = args.defaultParams || {}
    }

    async _call(arg: any): Promise<string> {
        const params = { ...arg, ...this.defaultParams }

        try {
            const body = {
                type: 'regular',
                recipients: {
                    list_id: params.listId
                },
                settings: {
                    subject_line: params.subjectLine,
                    from_name: params.fromName,
                    reply_to: params.replyTo
                }
            }
            const response = await this.makeMailchimpRequest({ endpoint: '/campaigns', method: 'POST', body, params })
            return response
        } catch (error) {
            return formatToolError(`Error creating campaign: ${error}`, params)
        }
    }
}

export const createMailchimpTools = (args?: RequestParameters): DynamicStructuredTool[] => {
    const tools: DynamicStructuredTool[] = []
    const actions = args?.actions || []
    const apiKey = args?.apiKey || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}
    const authConfig = args?.authConfig

    if (actions.includes('list_audiences')) {
        tools.push(
            new ListAudiencesTool({
                apiKey,
                maxOutputLength,
                defaultParams,
                authConfig
            })
        )
    }

    if (actions.includes('add_list_member')) {
        tools.push(
            new AddListMemberTool({
                apiKey,
                maxOutputLength,
                defaultParams,
                authConfig
            })
        )
    }

    if (actions.includes('get_list_member')) {
        tools.push(
            new GetListMemberTool({
                apiKey,
                maxOutputLength,
                defaultParams,
                authConfig
            })
        )
    }

    if (actions.includes('list_campaigns')) {
        tools.push(
            new ListCampaignsTool({
                apiKey,
                maxOutputLength,
                defaultParams,
                authConfig
            })
        )
    }

    if (actions.includes('create_campaign')) {
        tools.push(
            new CreateCampaignTool({
                apiKey,
                maxOutputLength,
                defaultParams,
                authConfig
            })
        )
    }

    return tools
}
