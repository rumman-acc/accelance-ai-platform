import { StatusCodes } from 'http-status-codes'
import { InternalAccelanceError } from '../../errors/internalAccelanceError'
import { getErrorMessage } from '../../errors/utils'
import credentialsService from '../credentials'
import toolsService from '../tools'

// Composio's REST surface used here matches composio-core@0.5.39 (the version already
// installed for the existing `Composio` node) -- confirmed by inspecting its bundled
// client rather than assuming the newer v3 SDK's endpoints, since a saved Tool's
// generated `func` runs in a sandboxed VM that cannot require composio-core itself
// (only axios/node-fetch are allowlisted), so it must call the same REST paths directly.
const COMPOSIO_BASE_URL = 'https://backend.composio.dev'

const SAFE_IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

interface FlatComposioField {
    key: string
    property: string
    description: string
    type: 'string' | 'number' | 'boolean' | 'date'
    required: boolean
}

const mapJsonSchemaTypeToFlatType = (schema: any): FlatComposioField['type'] => {
    const type = schema?.type
    if (type === 'integer' || type === 'number') return 'number'
    if (type === 'boolean') return 'boolean'
    return 'string'
}

// Sanitizes a JSON-Schema `properties` map into the Tool entity's flat schema format.
// Mirrors OpenAPIToolkit's exportSelectedEndpointsAsTools flattening convention: unsafe/
// duplicate identifiers fall back to paramN, with the real API field name preserved in
// the description so the generated func's request body still uses the correct field.
const buildFlatFieldsFromParameters = (parameters: any): FlatComposioField[] => {
    const properties = parameters?.properties && typeof parameters.properties === 'object' ? parameters.properties : {}
    const required: string[] = Array.isArray(parameters?.required) ? parameters.required : []
    const usedKeys = new Set<string>()
    let counter = 0

    return Object.keys(properties).map((rawName) => {
        const propSchema = properties[rawName] || {}
        let key = rawName
        if (!SAFE_IDENTIFIER.test(key) || usedKeys.has(key)) {
            counter += 1
            key = `param${counter}`
        }
        usedKeys.add(key)
        const description =
            key === rawName ? propSchema.description || rawName : `${propSchema.description || rawName} (API field: ${rawName})`
        return {
            key,
            property: key,
            description,
            type: mapJsonSchemaTypeToFlatType(propSchema),
            required: required.includes(rawName)
        }
    })
}

const buildComposioFunc = (
    actionName: string,
    apiKey: string,
    connectedAccountId: string | undefined,
    fields: FlatComposioField[]
): string => {
    const inputAssignments = fields.map((f) => `    input['${f.property}'] = $${f.property};`).join('\n')
    const connectedAccountLiteral = connectedAccountId ? `'${connectedAccountId}'` : 'undefined'
    return `const fetch = require('node-fetch');
const input = {};
${inputAssignments}
const options = {
    method: 'POST',
    headers: {
        'X-API-KEY': '${apiKey}',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        connectedAccountId: ${connectedAccountLiteral},
        input
    })
};
const response = await fetch('${COMPOSIO_BASE_URL}/api/v2/actions/${actionName}/execute', options);
const responseText = await response.text();
if (!response.ok) {
    throw new Error('Composio API Error ' + response.status + ': ' + responseText);
}
return responseText;`
}

const getComposioApiKey = async (credentialId: string, workspaceId: string): Promise<string> => {
    const credential = await credentialsService.getCredentialById(credentialId, workspaceId)
    const apiKey = credential?.plainDataObj?.composioApi
    if (!apiKey) {
        throw new InternalAccelanceError(StatusCodes.PRECONDITION_FAILED, 'Composio API key not found on the given credential')
    }
    return apiKey
}

const searchActions = async (credentialId: string, workspaceId: string, query: string) => {
    try {
        const apiKey = await getComposioApiKey(credentialId, workspaceId)
        const params = new URLSearchParams()
        if (query) params.set('useCase', query)
        params.set('usecaseLimit', '30')
        params.set('showEnabledOnly', 'true')

        const response = await fetch(`${COMPOSIO_BASE_URL}/api/v2/actions?${params.toString()}`, {
            headers: { 'X-API-KEY': apiKey }
        })
        if (!response.ok) {
            const text = await response.text()
            throw new Error(`Composio API Error ${response.status}: ${text}`)
        }
        const data: any = await response.json()
        const items = Array.isArray(data?.items) ? data.items : []
        return items.map((item: any) => ({
            name: item.name,
            displayName: item.displayName || item.name,
            description: item.description,
            appName: item.appName,
            appKey: item.appKey,
            logo: item.logo,
            noAuth: item.no_auth === true,
            tags: item.tags || []
        }))
    } catch (error) {
        throw new InternalAccelanceError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: composioCatalogService.searchActions - ${getErrorMessage(error)}`
        )
    }
}

const listConnections = async (credentialId: string, workspaceId: string, appName: string) => {
    try {
        const apiKey = await getComposioApiKey(credentialId, workspaceId)
        const params = new URLSearchParams({ appNames: appName.toLowerCase() })

        const response = await fetch(`${COMPOSIO_BASE_URL}/api/v1/connectedAccounts?${params.toString()}`, {
            headers: { 'X-API-KEY': apiKey }
        })
        if (!response.ok) {
            const text = await response.text()
            throw new Error(`Composio API Error ${response.status}: ${text}`)
        }
        const data: any = await response.json()
        const items = Array.isArray(data?.items) ? data.items : []
        return items
            .filter((c: any) => c.status === 'ACTIVE')
            .map((c: any) => ({
                id: c.id,
                label: c.clientUniqueUserId || c.id,
                createdAt: c.createdAt
            }))
    } catch (error) {
        throw new InternalAccelanceError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: composioCatalogService.listConnections - ${getErrorMessage(error)}`
        )
    }
}

const importAction = async (
    credentialId: string,
    workspaceId: string,
    orgId: string,
    actionName: string,
    connectedAccountId: string | undefined
) => {
    try {
        const apiKey = await getComposioApiKey(credentialId, workspaceId)

        const response = await fetch(`${COMPOSIO_BASE_URL}/api/v2/actions/${actionName}`, {
            headers: { 'X-API-KEY': apiKey }
        })
        if (!response.ok) {
            const text = await response.text()
            throw new Error(`Composio API Error ${response.status}: ${text}`)
        }
        const action: any = await response.json()

        if (action.no_auth !== true && !connectedAccountId) {
            throw new InternalAccelanceError(
                StatusCodes.PRECONDITION_FAILED,
                `${action.appName || actionName} requires a connected account. Please select one, or connect it on app.composio.dev first.`
            )
        }

        const fields = buildFlatFieldsFromParameters(action.parameters)
        const func = buildComposioFunc(actionName, apiKey, connectedAccountId, fields)
        const schema = fields.map((f) => ({
            property: f.property,
            description: f.description,
            type: f.type,
            required: f.required
        }))

        const toolBody = {
            name: action.displayName || action.name,
            description: action.description || `Composio action: ${action.name}`,
            color: '#6366f1',
            iconSrc: action.logo || undefined,
            schema: JSON.stringify(schema),
            func,
            workspaceId
        }

        return await toolsService.createTool(toolBody, orgId)
    } catch (error) {
        if (error instanceof InternalAccelanceError) throw error
        throw new InternalAccelanceError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: composioCatalogService.importAction - ${getErrorMessage(error)}`
        )
    }
}

export default {
    searchActions,
    listConnections,
    importAction
}
