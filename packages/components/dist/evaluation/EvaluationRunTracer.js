'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.EvaluationRunTracer = void 0
const run_collector_1 = require('@langchain/core/tracers/run_collector')
const EvaluationRunner_1 = require('./EvaluationRunner')
const tiktoken_1 = require('@dqbd/tiktoken')
class EvaluationRunTracer extends run_collector_1.RunCollectorCallbackHandler {
    constructor(id) {
        super()
        this.countPromptTokens = (encoding, run) => {
            let promptTokenCount = 0
            if (encoding) {
                if (run.inputs?.messages?.length > 0 && run.inputs?.messages[0]?.length > 0) {
                    run.inputs.messages[0].map((message) => {
                        let content = message.content
                            ? message.content
                            : message.SystemMessage?.content
                            ? message.SystemMessage.content
                            : message.HumanMessage?.content
                            ? message.HumanMessage.content
                            : message.AIMessage?.content
                            ? message.AIMessage.content
                            : undefined
                        promptTokenCount += content ? encoding.encode(content).length : 0
                    })
                }
                if (run.inputs?.prompts?.length > 0) {
                    const content = run.inputs.prompts[0]
                    promptTokenCount += content ? encoding.encode(content).length : 0
                }
            }
            return promptTokenCount
        }
        this.countCompletionTokens = (encoding, run) => {
            let completionTokenCount = 0
            if (encoding) {
                if (run.outputs?.generations?.length > 0 && run.outputs?.generations[0]?.length > 0) {
                    run.outputs?.generations[0].map((chunk) => {
                        let content = chunk.text ? chunk.text : chunk.message?.content ? chunk.message?.content : undefined
                        completionTokenCount += content ? encoding.encode(content).length : 0
                    })
                }
            }
            return completionTokenCount
        }
        this.extractModelName = (run) => {
            return (
                run?.serialized?.kwargs?.model ||
                run?.serialized?.kwargs?.model_name ||
                run?.extra?.metadata?.ls_model_name ||
                run?.extra?.metadata?.fw_model_name
            )
        }
        this.evaluationRunId = id
    }
    async persistRun(run) {
        return super.persistRun(run)
    }
    onLLMEnd(run) {
        if (run.name) {
            let provider = run.name
            if (provider === 'BedrockChat' || provider === 'bedrock-imported') {
                provider = 'awsChatBedrock'
            }
            EvaluationRunner_1.EvaluationRunner.addMetrics(
                this.evaluationRunId,
                JSON.stringify({
                    provider: provider
                })
            )
        }
        let model = this.extractModelName(run)
        if (run.outputs?.llmOutput?.tokenUsage) {
            const tokenUsage = run.outputs?.llmOutput?.tokenUsage
            if (tokenUsage) {
                const metric = {
                    completionTokens: tokenUsage.completionTokens,
                    promptTokens: tokenUsage.promptTokens,
                    model: model,
                    totalTokens: tokenUsage.totalTokens
                }
                EvaluationRunner_1.EvaluationRunner.addMetrics(this.evaluationRunId, JSON.stringify(metric))
            }
        } else if (
            run.outputs?.generations?.length > 0 &&
            run.outputs?.generations[0].length > 0 &&
            run.outputs?.generations[0][0]?.message?.usage_metadata?.total_tokens
        ) {
            const usage_metadata = run.outputs?.generations[0][0]?.message?.usage_metadata
            if (usage_metadata) {
                const metric = {
                    completionTokens: usage_metadata.output_tokens,
                    promptTokens: usage_metadata.input_tokens,
                    model: model || this.model,
                    totalTokens: usage_metadata.total_tokens
                }
                EvaluationRunner_1.EvaluationRunner.addMetrics(this.evaluationRunId, JSON.stringify(metric))
            }
        } else {
            let encoding = undefined
            let promptInputTokens = 0
            let completionTokenCount = 0
            try {
                encoding = (0, tiktoken_1.encoding_for_model)(model)
                promptInputTokens = this.countPromptTokens(encoding, run)
                completionTokenCount = this.countCompletionTokens(encoding, run)
            } catch (e) {
                try {
                    // as tiktoken will fail for non openai models, assume that is 'cl100k_base'
                    encoding = (0, tiktoken_1.get_encoding)('cl100k_base')
                    promptInputTokens = this.countPromptTokens(encoding, run)
                    completionTokenCount = this.countCompletionTokens(encoding, run)
                } catch (e) {
                    // stay silent
                }
            }
            const metric = {
                completionTokens: completionTokenCount,
                promptTokens: promptInputTokens,
                model: model,
                totalTokens: promptInputTokens + completionTokenCount
            }
            EvaluationRunner_1.EvaluationRunner.addMetrics(this.evaluationRunId, JSON.stringify(metric))
            //cleanup
            this.model = ''
        }
    }
    async onRunUpdate(run) {
        const json = {
            [run.run_type]: elapsed(run)
        }
        let metric = JSON.stringify(json)
        if (metric) {
            EvaluationRunner_1.EvaluationRunner.addMetrics(this.evaluationRunId, metric)
        }
        if (run.run_type === 'llm') {
            let model = this.extractModelName(run)
            if (model) {
                EvaluationRunner_1.EvaluationRunner.addMetrics(this.evaluationRunId, JSON.stringify({ model: model }))
                this.model = model
            }
            // OpenAI non streaming models
            const estimatedTokenUsage = run.outputs?.llmOutput?.estimatedTokenUsage
            if (estimatedTokenUsage && typeof estimatedTokenUsage === 'object' && Object.keys(estimatedTokenUsage).length > 0) {
                EvaluationRunner_1.EvaluationRunner.addMetrics(this.evaluationRunId, estimatedTokenUsage)
            }
        }
    }
}
exports.EvaluationRunTracer = EvaluationRunTracer
function elapsed(run) {
    if (!run.end_time) return ''
    const elapsed = run.end_time - run.start_time
    return `${elapsed.toFixed(2)}`
}
//# sourceMappingURL=EvaluationRunTracer.js.map
