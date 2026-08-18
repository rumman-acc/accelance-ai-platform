import { BaseCache } from '@langchain/core/caches'
import { ChatOpenAI, ChatOpenAIFields } from '@langchain/openai'
import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'
import { getModels, MODEL_TYPE } from '../../../src/modelLoader'

class ChatMoonshot_ChatModels implements INode {
    readonly baseURL: string = 'https://api.moonshot.ai/v1'
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Moonshot AI (Kimi)'
        this.name = 'chatMoonshot'
        this.version = 1.0
        this.type = 'ChatMoonshot'
        this.icon = 'moonshot.svg'
        this.category = 'Chat Models'
        this.description = 'Wrapper around Moonshot AI (Kimi) large language models that use an OpenAI-compatible Chat endpoint'
        this.baseClasses = [this.type, ...getBaseClasses(ChatOpenAI)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['moonshotApi']
        }
        this.inputs = [
            {
                label: 'Cache',
                name: 'cache',
                type: 'BaseCache',
                optional: true
            },
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'asyncOptions',
                loadMethod: 'listModels',
                default: 'kimi-k2.5'
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                default: 0.7,
                optional: true
            },
            {
                label: 'Streaming',
                name: 'streaming',
                type: 'boolean',
                default: true,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Max Tokens',
                name: 'maxTokens',
                type: 'number',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top Probability',
                name: 'topP',
                type: 'number',
                step: 0.1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Base Options',
                name: 'baseOptions',
                type: 'json',
                optional: true,
                additionalParams: true,
                description: 'Additional headers to pass to the Moonshot AI client. This should be a JSON object.'
            }
        ]
    }

    //@ts-ignore
    loadMethods = {
        async listModels(): Promise<INodeOptionsValue[]> {
            return await getModels(MODEL_TYPE.CHAT, 'chatMoonshot')
        }
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const temperature = nodeData.inputs?.temperature as string
        const modelName = nodeData.inputs?.modelName as string
        const maxTokens = nodeData.inputs?.maxTokens as string
        const topP = nodeData.inputs?.topP as string
        const streaming = nodeData.inputs?.streaming as boolean
        const baseOptions = nodeData.inputs?.baseOptions
        const cache = nodeData.inputs?.cache as BaseCache

        if (nodeData.inputs?.credentialId) {
            nodeData.credential = nodeData.inputs?.credentialId
        }
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const moonshotApiKey = getCredentialParam('moonshotApiKey', credentialData, nodeData)

        if (!moonshotApiKey) {
            throw new Error('Moonshot AI API Key missing from credential')
        }

        const obj: ChatOpenAIFields = {
            temperature: temperature ? parseFloat(temperature) : undefined,
            modelName,
            openAIApiKey: moonshotApiKey,
            apiKey: moonshotApiKey,
            streaming: streaming ?? true
        }

        if (maxTokens) obj.maxTokens = parseInt(maxTokens, 10)
        if (topP) obj.topP = parseFloat(topP)
        if (cache) obj.cache = cache

        let parsedBaseOptions: any | undefined = undefined
        if (baseOptions) {
            try {
                parsedBaseOptions = typeof baseOptions === 'object' ? baseOptions : JSON.parse(baseOptions)
            } catch (exception) {
                throw new Error('Invalid JSON in the ChatMoonshot BaseOptions: ' + exception)
            }
        }

        const model = new ChatOpenAI({
            ...obj,
            configuration: {
                baseURL: this.baseURL,
                defaultHeaders: parsedBaseOptions
            }
        })
        return model
    }
}

module.exports = { nodeClass: ChatMoonshot_ChatModels }
