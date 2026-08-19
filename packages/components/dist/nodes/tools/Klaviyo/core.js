'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.createKlaviyoTools = exports.desc = void 0
const v3_1 = require('zod/v3')
const core_1 = require('../OpenAPIToolkit/core')
const agents_1 = require('../../../src/agents')
const httpSecurity_1 = require('../../../src/httpSecurity')
exports.desc = `Use this when you want to access Klaviyo API for managing profiles and lists`
const KLAVIYO_API_BASE_URL = 'https://a.klaviyo.com/api'
const KLAVIYO_REVISION = '2024-10-15'
// Define schemas for different Klaviyo operations
const ListProfilesSchema = v3_1.z.object({
    limit: v3_1.z.number().optional().default(20).describe('Maximum number of profiles to return')
})
const CreateProfileSchema = v3_1.z.object({
    email: v3_1.z.string().describe('Email address of the profile'),
    firstName: v3_1.z.string().optional().describe('First name of the profile'),
    lastName: v3_1.z.string().optional().describe('Last name of the profile')
})
const GetProfileSchema = v3_1.z.object({
    profileId: v3_1.z.string().describe('ID of the profile to retrieve')
})
const ListListsSchema = v3_1.z.object({
    limit: v3_1.z.number().optional().default(20).describe('Maximum number of lists to return')
})
const SubscribeProfileToListSchema = v3_1.z.object({
    listId: v3_1.z.string().describe('ID of the list to subscribe the profile to'),
    profileId: v3_1.z.string().describe('ID of the profile to subscribe')
})
class BaseKlaviyoTool extends core_1.DynamicStructuredTool {
    constructor(args) {
        super(args)
        this.privateApiKey = ''
        this.privateApiKey = args.privateApiKey ?? ''
    }
    async makeKlaviyoRequest({ endpoint, method = 'GET', body, params }) {
        const url = `${KLAVIYO_API_BASE_URL}${endpoint}`
        const headers = {
            Authorization: `Klaviyo-API-Key ${this.privateApiKey}`,
            revision: KLAVIYO_REVISION,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...this.headers
        }
        const fetchOptions = {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        }
        const response = await (0, httpSecurity_1.secureFetch)(url, fetchOptions)
        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Klaviyo API Error ${response.status}: ${response.statusText} - ${errorText}`)
        }
        // Some Klaviyo endpoints (e.g. list-relationship writes) return 204 No Content on success
        if (response.status === 204) {
            return 'Success' + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
        }
        const data = await response.text()
        if (!data) {
            return 'Success' + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
        }
        return data + agents_1.TOOL_ARGS_PREFIX + JSON.stringify(params)
    }
}
class ListProfilesTool extends BaseKlaviyoTool {
    constructor(args) {
        const toolInput = {
            name: 'list_profiles',
            description: 'List profiles from Klaviyo',
            schema: ListProfilesSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            privateApiKey: args.privateApiKey,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/profiles?page[size]=${params.limit}`
            const response = await this.makeKlaviyoRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing profiles: ${error}`, params)
        }
    }
}
class CreateProfileTool extends BaseKlaviyoTool {
    constructor(args) {
        const toolInput = {
            name: 'create_profile',
            description: 'Create a new profile in Klaviyo',
            schema: CreateProfileSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            privateApiKey: args.privateApiKey,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const attributes = {
                email: params.email
            }
            if (params.firstName) attributes.first_name = params.firstName
            if (params.lastName) attributes.last_name = params.lastName
            const body = {
                data: {
                    type: 'profile',
                    attributes
                }
            }
            const endpoint = '/profiles'
            const response = await this.makeKlaviyoRequest({ endpoint, method: 'POST', body, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error creating profile: ${error}`, params)
        }
    }
}
class GetProfileTool extends BaseKlaviyoTool {
    constructor(args) {
        const toolInput = {
            name: 'get_profile',
            description: 'Get a specific profile from Klaviyo',
            schema: GetProfileSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            privateApiKey: args.privateApiKey,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/profiles/${params.profileId}`
            const response = await this.makeKlaviyoRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error getting profile: ${error}`, params)
        }
    }
}
class ListListsTool extends BaseKlaviyoTool {
    constructor(args) {
        const toolInput = {
            name: 'list_lists',
            description: 'List lists from Klaviyo',
            schema: ListListsSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        }
        super({
            ...toolInput,
            privateApiKey: args.privateApiKey,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const endpoint = `/lists?page[size]=${params.limit}`
            const response = await this.makeKlaviyoRequest({ endpoint, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error listing lists: ${error}`, params)
        }
    }
}
class SubscribeProfileToListTool extends BaseKlaviyoTool {
    constructor(args) {
        const toolInput = {
            name: 'subscribe_profile_to_list',
            description: 'Subscribe a profile to a list in Klaviyo',
            schema: SubscribeProfileToListSchema,
            baseUrl: '',
            method: 'POST',
            headers: {}
        }
        super({
            ...toolInput,
            privateApiKey: args.privateApiKey,
            maxOutputLength: args.maxOutputLength
        })
        this.defaultParams = args.defaultParams || {}
    }
    async _call(arg) {
        const params = { ...arg, ...this.defaultParams }
        try {
            const body = {
                data: [
                    {
                        type: 'profile',
                        id: params.profileId
                    }
                ]
            }
            const endpoint = `/lists/${params.listId}/relationships/profiles`
            const response = await this.makeKlaviyoRequest({ endpoint, method: 'POST', body, params })
            return response
        } catch (error) {
            return (0, agents_1.formatToolError)(`Error subscribing profile to list: ${error}`, params)
        }
    }
}
const createKlaviyoTools = (args) => {
    const tools = []
    const actions = args?.actions || []
    const privateApiKey = args?.privateApiKey || ''
    const maxOutputLength = args?.maxOutputLength || Infinity
    const defaultParams = args?.defaultParams || {}
    if (actions.includes('list_profiles')) {
        tools.push(
            new ListProfilesTool({
                privateApiKey,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('create_profile')) {
        tools.push(
            new CreateProfileTool({
                privateApiKey,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('get_profile')) {
        tools.push(
            new GetProfileTool({
                privateApiKey,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('list_lists')) {
        tools.push(
            new ListListsTool({
                privateApiKey,
                maxOutputLength,
                defaultParams
            })
        )
    }
    if (actions.includes('subscribe_profile_to_list')) {
        tools.push(
            new SubscribeProfileToListTool({
                privateApiKey,
                maxOutputLength,
                defaultParams
            })
        )
    }
    return tools
}
exports.createKlaviyoTools = createKlaviyoTools
//# sourceMappingURL=core.js.map
