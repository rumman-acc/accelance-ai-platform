'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const v3_1 = require('zod/v3')
const manager_1 = require('@langchain/core/callbacks/manager')
const tools_1 = require('@langchain/core/tools')
const utils_1 = require('../../../src/utils')
const agents_1 = require('../../../src/agents')
const howToUse = `Add additional filters to vector store. You can also filter with flow config, including the current "state":
- \`$flow.sessionId\`
- \`$flow.chatId\`
- \`$flow.chatflowId\`
- \`$flow.input\`
- \`$flow.state\`
`
class DynamicStructuredTool extends tools_1.StructuredTool {
    static lc_name() {
        return 'DynamicStructuredTool'
    }
    constructor(fields) {
        super(fields)
        this.name = fields.name
        this.description = fields.description
        this.func = fields.func
        this.returnDirect = fields.returnDirect ?? this.returnDirect
        this.schema = fields.schema
    }
    async call(arg, configArg, tags, flowConfig) {
        const config = (0, manager_1.parseCallbackConfigArg)(configArg)
        if (config.runName === undefined) {
            config.runName = this.name
        }
        let parsed
        try {
            parsed = await (0, utils_1.parseWithTypeConversion)(this.schema, arg)
        } catch (e) {
            throw new tools_1.ToolInputParsingException(`Received tool input did not match expected schema`, JSON.stringify(arg))
        }
        const callbackManager_ = await manager_1.CallbackManager.configure(
            config.callbacks,
            this.callbacks,
            config.tags || tags,
            this.tags,
            config.metadata,
            this.metadata,
            { verbose: this.verbose }
        )
        const runManager = await callbackManager_?.handleToolStart(
            this.toJSON(),
            typeof parsed === 'string' ? parsed : JSON.stringify(parsed),
            undefined,
            undefined,
            undefined,
            undefined,
            config.runName
        )
        let result
        try {
            result = await this._call(parsed, runManager, flowConfig)
        } catch (e) {
            await runManager?.handleToolError(e)
            throw e
        }
        if (result && typeof result !== 'string') {
            result = JSON.stringify(result)
        }
        await runManager?.handleToolEnd(result)
        return result
    }
    // @ts-ignore
    _call(arg, runManager, flowConfig) {
        let flowConfiguration = {}
        if (typeof arg === 'object' && Object.keys(arg).length) {
            for (const item in arg) {
                flowConfiguration[`$${item}`] = arg[item]
            }
        }
        // inject flow properties
        if (this.flowObj) {
            flowConfiguration['$flow'] = { ...this.flowObj, ...flowConfig }
        }
        return this.func(arg, runManager, flowConfiguration)
    }
    setFlowObject(flow) {
        this.flowObj = flow
    }
}
class Retriever_Tools {
    constructor() {
        this.label = 'Retriever Tool'
        this.name = 'retrieverTool'
        this.version = 3.0
        this.type = 'RetrieverTool'
        this.icon = 'retrievertool.svg'
        this.category = 'Tools'
        this.description = 'Use a retriever as allowed tool for agent'
        this.baseClasses = [this.type, 'DynamicTool', ...(0, utils_1.getBaseClasses)(tools_1.DynamicTool)]
        this.inputs = [
            {
                label: 'Retriever Name',
                name: 'name',
                type: 'string',
                placeholder: 'search_state_of_union'
            },
            {
                label: 'Retriever Description',
                name: 'description',
                type: 'string',
                description: 'When should agent uses to retrieve documents',
                rows: 3,
                placeholder: 'Searches and returns documents regarding the state-of-the-union.'
            },
            {
                label: 'Retriever',
                name: 'retriever',
                type: 'BaseRetriever'
            },
            {
                label: 'Return Source Documents',
                name: 'returnSourceDocuments',
                type: 'boolean',
                optional: true
            },
            {
                label: 'Additional Metadata Filter',
                name: 'retrieverToolMetadataFilter',
                type: 'json',
                description: 'Add additional metadata filter on top of the existing filter from vector store',
                optional: true,
                additionalParams: true,
                hint: {
                    label: 'What can you filter?',
                    value: howToUse
                },
                acceptVariable: true
            }
        ]
    }
    async init(nodeData, _, options) {
        const name = nodeData.inputs?.name
        const description = nodeData.inputs?.description
        const retriever = nodeData.inputs?.retriever
        const returnSourceDocuments = nodeData.inputs?.returnSourceDocuments
        const retrieverToolMetadataFilter = nodeData.inputs?.retrieverToolMetadataFilter
        const input = {
            name,
            description
        }
        const flow = { chatflowId: options.chatflowid }
        const func = async ({ input }, _, flowConfig) => {
            if (retrieverToolMetadataFilter) {
                const flowObj = flowConfig
                const metadataFilter =
                    typeof retrieverToolMetadataFilter === 'object' ? retrieverToolMetadataFilter : JSON.parse(retrieverToolMetadataFilter)
                const newMetadataFilter = (0, utils_1.resolveFlowObjValue)(metadataFilter, flowObj)
                if (newMetadataFilter && typeof newMetadataFilter === 'object' && Object.keys(newMetadataFilter).length > 0) {
                    const vectorStore = retriever.vectorStore
                    vectorStore.filter = newMetadataFilter
                }
            }
            const docs = await retriever.invoke(input)
            const content = docs.map((doc) => doc.pageContent).join('\n\n')
            const sourceDocuments = JSON.stringify(docs)
            return returnSourceDocuments ? content + agents_1.SOURCE_DOCUMENTS_PREFIX + sourceDocuments : content
        }
        const schema = v3_1.z.object({
            input: v3_1.z.string().describe('input to look up in retriever')
        })
        const tool = new DynamicStructuredTool({ ...input, func, schema })
        tool.setFlowObject(flow)
        return tool
    }
}
module.exports = { nodeClass: Retriever_Tools }
//# sourceMappingURL=RetrieverTool.js.map
