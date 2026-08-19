'use strict'
var __createBinding =
    (this && this.__createBinding) ||
    (Object.create
        ? function (o, m, k, k2) {
              if (k2 === undefined) k2 = k
              var desc = Object.getOwnPropertyDescriptor(m, k)
              if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
                  desc = {
                      enumerable: true,
                      get: function () {
                          return m[k]
                      }
                  }
              }
              Object.defineProperty(o, k2, desc)
          }
        : function (o, m, k, k2) {
              if (k2 === undefined) k2 = k
              o[k2] = m[k]
          })
var __setModuleDefault =
    (this && this.__setModuleDefault) ||
    (Object.create
        ? function (o, v) {
              Object.defineProperty(o, 'default', { enumerable: true, value: v })
          }
        : function (o, v) {
              o['default'] = v
          })
var __importStar =
    (this && this.__importStar) ||
    function (mod) {
        if (mod && mod.__esModule) return mod
        var result = {}
        if (mod != null)
            for (var k in mod) if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k)
        __setModuleDefault(result, mod)
        return result
    }
Object.defineProperty(exports, '__esModule', { value: true })
exports.HuggingFaceInference = void 0
const llms_1 = require('@langchain/core/language_models/llms')
const utils_1 = require('../../../src/utils')
const outputs_1 = require('@langchain/core/outputs')
class HuggingFaceInference extends llms_1.LLM {
    get lc_secrets() {
        return {
            apiKey: 'HUGGINGFACEHUB_API_KEY'
        }
    }
    constructor(fields) {
        super(fields ?? {})
        this.model = 'gpt2'
        this.temperature = undefined
        this.stopSequences = undefined
        this.maxTokens = undefined
        this.topP = undefined
        this.topK = undefined
        this.frequencyPenalty = undefined
        this.apiKey = undefined
        this.endpointUrl = undefined
        this.includeCredentials = undefined
        this.model = fields?.model ?? this.model
        this.temperature = fields?.temperature ?? this.temperature
        this.maxTokens = fields?.maxTokens ?? this.maxTokens
        this.stopSequences = fields?.stopSequences ?? this.stopSequences
        this.topP = fields?.topP ?? this.topP
        this.topK = fields?.topK ?? this.topK
        this.frequencyPenalty = fields?.frequencyPenalty ?? this.frequencyPenalty
        this.apiKey = fields?.apiKey ?? (0, utils_1.getEnvironmentVariable)('HUGGINGFACEHUB_API_KEY')
        this.endpointUrl = fields?.endpointUrl
        this.includeCredentials = fields?.includeCredentials
        if (!this.apiKey || this.apiKey.trim() === '') {
            throw new Error(
                'Please set an API key for HuggingFace Hub. Either configure it in the credential settings in the UI, or set the environment variable HUGGINGFACEHUB_API_KEY.'
            )
        }
    }
    _llmType() {
        return 'hf'
    }
    invocationParams(options) {
        // Return parameters compatible with chatCompletion API (OpenAI-compatible format)
        const params = {
            temperature: this.temperature,
            max_tokens: this.maxTokens,
            stop: options?.stop ?? this.stopSequences,
            top_p: this.topP
        }
        // Include optional parameters if they are defined
        if (this.topK !== undefined) {
            params.top_k = this.topK
        }
        if (this.frequencyPenalty !== undefined) {
            params.frequency_penalty = this.frequencyPenalty
        }
        return params
    }
    async *_streamResponseChunks(prompt, options, runManager) {
        try {
            const client = await this._prepareHFInference()
            const stream = await this.caller.call(async () =>
                client.chatCompletionStream({
                    model: this.model,
                    messages: [{ role: 'user', content: prompt }],
                    ...this.invocationParams(options)
                })
            )
            for await (const chunk of stream) {
                const token = chunk.choices[0]?.delta?.content || ''
                if (token) {
                    yield new outputs_1.GenerationChunk({ text: token, generationInfo: chunk })
                    await runManager?.handleLLMNewToken(token)
                }
                // stream is done when finish_reason is set
                if (chunk.choices[0]?.finish_reason) {
                    yield new outputs_1.GenerationChunk({
                        text: '',
                        generationInfo: { finished: true }
                    })
                    break
                }
            }
        } catch (error) {
            console.error('[ChatHuggingFace] Error in _streamResponseChunks:', error)
            // Provide more helpful error messages
            if (error?.message?.includes('endpointUrl') || error?.message?.includes('third-party provider')) {
                throw new Error(
                    `Cannot use custom endpoint with model "${this.model}" that includes a provider. Please leave the Endpoint field blank in the UI. Original error: ${error.message}`
                )
            }
            throw error
        }
    }
    /** @ignore */
    async _call(prompt, options) {
        try {
            const client = await this._prepareHFInference()
            // Use chatCompletion for chat models (v4 supports conversational models via Inference Providers)
            const args = {
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                ...this.invocationParams(options)
            }
            const res = await this.caller.callWithOptions({ signal: options.signal }, client.chatCompletion.bind(client), args)
            const content = res.choices[0]?.message?.content || ''
            if (!content) {
                console.error('[ChatHuggingFace] No content in response:', JSON.stringify(res))
                throw new Error(`No content received from HuggingFace API. Response: ${JSON.stringify(res)}`)
            }
            return content
        } catch (error) {
            console.error('[ChatHuggingFace] Error in _call:', error.message)
            // Provide more helpful error messages
            if (error?.message?.includes('endpointUrl') || error?.message?.includes('third-party provider')) {
                throw new Error(
                    `Cannot use custom endpoint with model "${this.model}" that includes a provider. Please leave the Endpoint field blank in the UI. Original error: ${error.message}`
                )
            }
            if (error?.message?.includes('Invalid username or password') || error?.message?.includes('authentication')) {
                throw new Error(
                    `HuggingFace API authentication failed. Please verify your API key is correct and starts with "hf_". Original error: ${error.message}`
                )
            }
            throw error
        }
    }
    /** @ignore */
    async _prepareHFInference() {
        if (!this.apiKey || this.apiKey.trim() === '') {
            console.error('[ChatHuggingFace] API key validation failed: Empty or undefined')
            throw new Error('HuggingFace API key is required. Please configure it in the credential settings.')
        }
        const { InferenceClient } = await HuggingFaceInference.imports()
        // Use InferenceClient for chat models (works better with Inference Providers)
        const client = new InferenceClient(this.apiKey)
        // Don't override endpoint if model uses a provider (contains ':') or if endpoint is router-based
        // When using Inference Providers, endpoint should be left blank - InferenceClient handles routing automatically
        if (
            this.endpointUrl &&
            !this.model.includes(':') &&
            !this.endpointUrl.includes('/v1/chat/completions') &&
            !this.endpointUrl.includes('router.huggingface.co')
        ) {
            return client.endpoint(this.endpointUrl)
        }
        // Return client without endpoint override - InferenceClient will use Inference Providers automatically
        return client
    }
    /** @ignore */
    static async imports() {
        try {
            const { InferenceClient } = await Promise.resolve().then(() => __importStar(require('@huggingface/inference')))
            return { InferenceClient }
        } catch (e) {
            throw new Error('Please install huggingface as a dependency with, e.g. `pnpm install @huggingface/inference`')
        }
    }
}
exports.HuggingFaceInference = HuggingFaceInference
//# sourceMappingURL=core.js.map
