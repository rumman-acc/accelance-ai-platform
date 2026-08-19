'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.DynamicStructuredTool = void 0
const tools_1 = require('@langchain/core/tools')
const manager_1 = require('@langchain/core/callbacks/manager')
const utils_1 = require('../../../src/utils')
class ToolInputParsingException extends Error {
    constructor(message, output) {
        super(message)
        this.output = output
    }
}
class DynamicStructuredTool extends tools_1.StructuredTool {
    constructor(fields) {
        super(fields)
        this.name = fields.name
        this.description = fields.description
        this.code = fields.code
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
            throw new ToolInputParsingException(`Received tool input did not match expected schema`, JSON.stringify(arg))
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
    async _call(arg, _, flowConfig) {
        // Create additional sandbox variables for tool arguments
        const additionalSandbox = {}
        if (typeof arg === 'object' && Object.keys(arg).length) {
            for (const item in arg) {
                additionalSandbox[`$${item}`] = arg[item]
            }
        }
        // Prepare flow object for sandbox
        const flow = this.flowObj ? { ...this.flowObj, ...flowConfig } : {}
        const sandbox = (0, utils_1.createCodeExecutionSandbox)('', this.variables || [], flow, additionalSandbox)
        let response = await (0, utils_1.executeJavaScriptCode)(this.code, sandbox)
        if (typeof response === 'object') {
            response = JSON.stringify(response)
        }
        return response
    }
    setVariables(variables) {
        this.variables = variables
    }
    setFlowObject(flow) {
        this.flowObj = flow
    }
}
exports.DynamicStructuredTool = DynamicStructuredTool
//# sourceMappingURL=core.js.map
