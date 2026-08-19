'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const utils_1 = require('../../../src/utils')
const llamaindex_1 = require('llamaindex')
class ChatOllama_LlamaIndex_ChatModels {
    constructor() {
        this.label = 'ChatOllama'
        this.name = 'chatOllama_LlamaIndex'
        this.version = 1.0
        this.type = 'ChatOllama'
        this.icon = 'Ollama.svg'
        this.category = 'Chat Models'
        this.description = 'Wrapper around ChatOllama LLM specific for LlamaIndex'
        this.baseClasses = [this.type, 'BaseChatModel_LlamaIndex', ...(0, utils_1.getBaseClasses)(llamaindex_1.Ollama)]
        this.tags = ['LlamaIndex']
        this.badge = 'DEPRECATING'
        this.deprecateMessage = 'LlamaIndex integration is deprecated and will be removed in a future release.'
        this.inputs = [
            {
                label: 'Base URL',
                name: 'baseUrl',
                type: 'string',
                default: 'http://localhost:11434'
            },
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'string',
                placeholder: 'llama3'
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                description:
                    'The temperature of the model. Increasing the temperature will make the model answer more creatively. (Default: 0.8). Refer to <a target="_blank" href="https://github.com/jmorganca/ollama/blob/main/docs/modelfile.md#valid-parameters-and-values">docs</a> for more details',
                step: 0.1,
                default: 0.9,
                optional: true
            },
            {
                label: 'Top P',
                name: 'topP',
                type: 'number',
                description:
                    'Works together with top-k. A higher value (e.g., 0.95) will lead to more diverse text, while a lower value (e.g., 0.5) will generate more focused and conservative text. (Default: 0.9). Refer to <a target="_blank" href="https://github.com/jmorganca/ollama/blob/main/docs/modelfile.md#valid-parameters-and-values">docs</a> for more details',
                step: 0.1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top K',
                name: 'topK',
                type: 'number',
                description:
                    'Reduces the probability of generating nonsense. A higher value (e.g. 100) will give more diverse answers, while a lower value (e.g. 10) will be more conservative. (Default: 40). Refer to <a target="_blank" href="https://github.com/jmorganca/ollama/blob/main/docs/modelfile.md#valid-parameters-and-values">docs</a> for more details',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Mirostat',
                name: 'mirostat',
                type: 'number',
                description:
                    'Enable Mirostat sampling for controlling perplexity. (default: 0, 0 = disabled, 1 = Mirostat, 2 = Mirostat 2.0). Refer to <a target="_blank" href="https://github.com/jmorganca/ollama/blob/main/docs/modelfile.md#valid-parameters-and-values">docs</a> for more details',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Mirostat ETA',
                name: 'mirostatEta',
                type: 'number',
                description:
                    'Influences how quickly the algorithm responds to feedback from the generated text. A lower learning rate will result in slower adjustments, while a higher learning rate will make the algorithm more responsive. (Default: 0.1) Refer to <a target="_blank" href="https://github.com/jmorganca/ollama/blob/main/docs/modelfile.md#valid-parameters-and-values">docs</a> for more details',
                step: 0.1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Mirostat TAU',
                name: 'mirostatTau',
                type: 'number',
                description:
                    'Controls the balance between coherence and diversity of the output. A lower value will result in more focused and coherent text. (Default: 5.0) Refer to <a target="_blank" href="https://github.com/jmorganca/ollama/blob/main/docs/modelfile.md#valid-parameters-and-values">docs</a> for more details',
                step: 0.1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Context Window Size',
                name: 'numCtx',
                type: 'number',
                description:
                    'Sets the size of the context window used to generate the next token. (Default: 2048) Refer to <a target="_blank" href="https://github.com/jmorganca/ollama/blob/main/docs/modelfile.md#valid-parameters-and-values">docs</a> for more details',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Number of GPU',
                name: 'numGpu',
                type: 'number',
                description:
                    'The number of layers to send to the GPU(s). On macOS it defaults to 1 to enable metal support, 0 to disable. Refer to <a target="_blank" href="https://github.com/jmorganca/ollama/blob/main/docs/modelfile.md#valid-parameters-and-values">docs</a> for more details',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Number of Thread',
                name: 'numThread',
                type: 'number',
                description:
                    'Sets the number of threads to use during computation. By default, Ollama will detect this for optimal performance. It is recommended to set this value to the number of physical CPU cores your system has (as opposed to the logical number of cores). Refer to <a target="_blank" href="https://github.com/jmorganca/ollama/blob/main/docs/modelfile.md#valid-parameters-and-values">docs</a> for more details',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Repeat Last N',
                name: 'repeatLastN',
                type: 'number',
                description:
                    'Sets how far back for the model to look back to prevent repetition. (Default: 64, 0 = disabled, -1 = num_ctx). Refer to <a target="_blank" href="https://github.com/jmorganca/ollama/blob/main/docs/modelfile.md#valid-parameters-and-values">docs</a> for more details',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Repeat Penalty',
                name: 'repeatPenalty',
                type: 'number',
                description:
                    'Sets how strongly to penalize repetitions. A higher value (e.g., 1.5) will penalize repetitions more strongly, while a lower value (e.g., 0.9) will be more lenient. (Default: 1.1). Refer to <a target="_blank" href="https://github.com/jmorganca/ollama/blob/main/docs/modelfile.md#valid-parameters-and-values">docs</a> for more details',
                step: 0.1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Stop Sequence',
                name: 'stop',
                type: 'string',
                rows: 4,
                placeholder: 'AI assistant:',
                description:
                    'Sets the stop sequences to use. Use comma to seperate different sequences. Refer to <a target="_blank" href="https://github.com/jmorganca/ollama/blob/main/docs/modelfile.md#valid-parameters-and-values">docs</a> for more details',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Tail Free Sampling',
                name: 'tfsZ',
                type: 'number',
                description:
                    'Tail free sampling is used to reduce the impact of less probable tokens from the output. A higher value (e.g., 2.0) will reduce the impact more, while a value of 1.0 disables this setting. (Default: 1). Refer to <a target="_blank" href="https://github.com/jmorganca/ollama/blob/main/docs/modelfile.md#valid-parameters-and-values">docs</a> for more details',
                step: 0.1,
                optional: true,
                additionalParams: true
            }
        ]
    }
    async init(nodeData) {
        const temperature = nodeData.inputs?.temperature
        const baseUrl = nodeData.inputs?.baseUrl
        const modelName = nodeData.inputs?.modelName
        const topP = nodeData.inputs?.topP
        const topK = nodeData.inputs?.topK
        const mirostat = nodeData.inputs?.mirostat
        const mirostatEta = nodeData.inputs?.mirostatEta
        const mirostatTau = nodeData.inputs?.mirostatTau
        const numCtx = nodeData.inputs?.numCtx
        const numGpu = nodeData.inputs?.numGpu
        const numThread = nodeData.inputs?.numThread
        const repeatLastN = nodeData.inputs?.repeatLastN
        const repeatPenalty = nodeData.inputs?.repeatPenalty
        const stop = nodeData.inputs?.stop
        const tfsZ = nodeData.inputs?.tfsZ
        const obj = {
            model: modelName,
            options: {},
            config: {
                host: baseUrl
            }
        }
        if (temperature) obj.options.temperature = parseFloat(temperature)
        if (topP) obj.options.top_p = parseFloat(topP)
        if (topK) obj.options.top_k = parseFloat(topK)
        if (mirostat) obj.options.mirostat = parseFloat(mirostat)
        if (mirostatEta) obj.options.mirostat_eta = parseFloat(mirostatEta)
        if (mirostatTau) obj.options.mirostat_tau = parseFloat(mirostatTau)
        if (numCtx) obj.options.num_ctx = parseFloat(numCtx)
        if (numGpu) obj.options.main_gpu = parseFloat(numGpu)
        if (numThread) obj.options.num_thread = parseFloat(numThread)
        if (repeatLastN) obj.options.repeat_last_n = parseFloat(repeatLastN)
        if (repeatPenalty) obj.options.repeat_penalty = parseFloat(repeatPenalty)
        if (tfsZ) obj.options.tfs_z = parseFloat(tfsZ)
        if (stop) {
            const stopSequences = stop.split(',')
            obj.options.stop = stopSequences
        }
        const model = new llamaindex_1.Ollama(obj)
        return model
    }
}
module.exports = { nodeClass: ChatOllama_LlamaIndex_ChatModels }
//# sourceMappingURL=ChatOllama_LlamaIndex.js.map
