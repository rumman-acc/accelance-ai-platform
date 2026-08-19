'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const lodash_1 = require('lodash')
const utils_1 = require('../../../src/utils')
class CustomFunction_Utilities {
    constructor() {
        this.label = 'Custom JS Function'
        this.name = 'customFunction'
        this.version = 3.0
        this.type = 'CustomFunction'
        this.icon = 'customfunction.svg'
        this.category = 'Utilities'
        this.description = `Execute custom javascript function`
        this.baseClasses = [this.type, 'Utilities']
        this.tags = ['Utilities']
        this.inputs = [
            {
                label: 'Input Variables',
                name: 'functionInputVariables',
                description: 'Input variables can be used in the function with prefix $. For example: $var',
                type: 'json',
                optional: true,
                acceptVariable: true,
                list: true
            },
            {
                label: 'Function Name',
                name: 'functionName',
                type: 'string',
                optional: true,
                placeholder: 'My Function'
            },
            {
                label: 'Additional Tools',
                description: 'Tools can be used in the function with $tools.{tool_name}.invoke(args)',
                name: 'tools',
                type: 'Tool',
                list: true,
                optional: true
            },
            {
                label: 'Javascript Function',
                name: 'javascriptFunction',
                type: 'code'
            }
        ]
        this.outputs = [
            {
                label: 'Output',
                name: 'output',
                baseClasses: ['string', 'number', 'boolean', 'json', 'array']
            },
            {
                label: 'Ending Node',
                name: 'EndingNode',
                baseClasses: [this.type]
            }
        ]
    }
    async init(nodeData, input, options) {
        const isEndingNode = nodeData?.outputs?.output === 'EndingNode'
        if (isEndingNode && !options.isRun) return // prevent running both init and run twice
        const javascriptFunction = nodeData.inputs?.javascriptFunction
        const functionInputVariablesRaw = nodeData.inputs?.functionInputVariables
        const appDataSource = options.appDataSource
        const databaseEntities = options.databaseEntities
        const tools = Object.fromEntries((0, lodash_1.flatten)(nodeData.inputs?.tools)?.map((tool) => [tool.name, tool]) ?? [])
        const variables = await (0, utils_1.getVars)(appDataSource, databaseEntities, nodeData, options)
        const flow = {
            input,
            chatflowId: options.chatflowid,
            sessionId: options.sessionId,
            chatId: options.chatId,
            rawOutput: options.postProcessing?.rawOutput || '',
            chatHistory: options.postProcessing?.chatHistory || [],
            sourceDocuments: options.postProcessing?.sourceDocuments,
            usedTools: options.postProcessing?.usedTools,
            artifacts: options.postProcessing?.artifacts,
            fileAnnotations: options.postProcessing?.fileAnnotations
        }
        let inputVars = {}
        if (functionInputVariablesRaw) {
            try {
                inputVars =
                    typeof functionInputVariablesRaw === 'object' ? functionInputVariablesRaw : JSON.parse(functionInputVariablesRaw)
            } catch (exception) {
                throw new Error('Invalid JSON in the Custom Function Input Variables: ' + exception)
            }
        }
        // Some values might be a stringified JSON, parse it
        for (const key in inputVars) {
            let value = inputVars[key]
            if (typeof value === 'string') {
                value = (0, utils_1.handleEscapeCharacters)(value, true)
                if (value.startsWith('{') && value.endsWith('}')) {
                    try {
                        value = JSON.parse(value)
                    } catch (e) {
                        // ignore
                    }
                }
                inputVars[key] = value
            }
        }
        // Create additional sandbox variables
        const additionalSandbox = {
            $tools: tools
        }
        // Add input variables to sandbox
        if (Object.keys(inputVars).length) {
            for (const item in inputVars) {
                additionalSandbox[`$${item}`] = inputVars[item]
            }
        }
        const sandbox = (0, utils_1.createCodeExecutionSandbox)(input, variables, flow, additionalSandbox)
        try {
            const response = await (0, utils_1.executeJavaScriptCode)(javascriptFunction, sandbox)
            if (typeof response === 'string' && !isEndingNode) {
                return (0, utils_1.handleEscapeCharacters)(response, false)
            }
            return response
        } catch (e) {
            throw new Error(e)
        }
    }
    async run(nodeData, input, options) {
        return await this.init(nodeData, input, { ...options, isRun: true })
    }
}
module.exports = { nodeClass: CustomFunction_Utilities }
//# sourceMappingURL=CustomFunction.js.map
