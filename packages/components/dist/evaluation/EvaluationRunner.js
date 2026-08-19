"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationRunner = void 0;
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const modelLoader_1 = require("../src/modelLoader");
class EvaluationRunner {
    static async getAndDeleteMetrics(id) {
        const val = _a.metrics.get(id);
        if (val) {
            try {
                //first lets get the provider and model
                let selectedModel = undefined;
                let selectedProvider = undefined;
                if (val && val.length > 0) {
                    let modelName = '';
                    let providerName = '';
                    for (let i = 0; i < val.length; i++) {
                        const metric = val[i];
                        if (typeof metric === 'object') {
                            modelName = metric['model'];
                            providerName = metric['provider'];
                        }
                        else {
                            modelName = JSON.parse(metric)['model'];
                            providerName = JSON.parse(metric)['provider'];
                        }
                        if (modelName) {
                            selectedModel = modelName;
                        }
                        if (providerName) {
                            selectedProvider = providerName;
                        }
                    }
                }
                if (selectedProvider && selectedModel) {
                    const modelConfig = await _a.getCostMetrics(selectedProvider, selectedModel);
                    if (modelConfig) {
                        val.push(JSON.stringify({ cost_values: modelConfig }));
                    }
                }
            }
            catch (error) {
                //stay silent
            }
        }
        _a.metrics.delete(id);
        return val;
    }
    static addMetrics(id, metric) {
        if (_a.metrics.has(id)) {
            _a.metrics.get(id)?.push(metric);
        }
        else {
            _a.metrics.set(id, [metric]);
        }
    }
    constructor(baseURL) {
        this.baseURL = '';
        this.baseURL = baseURL;
    }
    getChatflowApiKey(chatflowId, apiKeys = []) {
        return apiKeys.find((item) => item.chatflowId === chatflowId)?.apiKey || '';
    }
    async runEvaluations(data) {
        const chatflowIds = JSON.parse(data.chatflowId);
        if (!Array.isArray(chatflowIds)) {
            throw new Error('chatflowId must be a valid array');
        }
        if (!data.dataset || !Array.isArray(data.dataset.rows)) {
            throw new Error('dataset.rows must be a valid array');
        }
        const returnData = {};
        returnData.evaluationId = data.evaluationId;
        returnData.runDate = new Date();
        returnData.rows = [];
        for (let i = 0; i < data.dataset.rows.length; i++) {
            returnData.rows.push({
                input: data.dataset.rows[i].input,
                expectedOutput: data.dataset.rows[i].output,
                itemNo: data.dataset.rows[i].sequenceNo,
                evaluations: [],
                status: 'pending'
            });
        }
        for (let i = 0; i < chatflowIds.length; i++) {
            const chatflowId = chatflowIds[i];
            await this.evaluateChatflow(chatflowId, this.getChatflowApiKey(chatflowId, data.apiKeys), data, returnData);
        }
        return returnData;
    }
    async evaluateChatflow(chatflowId, apiKey, data, returnData) {
        for (let i = 0; i < data.dataset.rows.length; i++) {
            const item = data.dataset.rows[i];
            const uuid = (0, uuid_1.v4)();
            const headers = {
                'X-Request-ID': uuid,
                'X-Flowise-Evaluation': 'true'
            };
            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }
            let axiosConfig = {
                headers: headers
            };
            let startTime = performance.now();
            const runData = {};
            runData.chatflowId = chatflowId;
            runData.startTime = startTime;
            const postData = { question: item.input, evaluationRunId: uuid, evaluation: true };
            if (data.sessionId) {
                postData.overrideConfig = { sessionId: data.sessionId };
            }
            try {
                let response = await axios_1.default.post(`${this.baseURL}/api/prediction/${chatflowId}`, postData, axiosConfig);
                let agentFlowMetrics = [];
                if (response?.data?.agentFlowExecutedData) {
                    for (let i = 0; i < response.data.agentFlowExecutedData.length; i++) {
                        const agentFlowExecutedData = response.data.agentFlowExecutedData[i];
                        const input_tokens = agentFlowExecutedData?.data?.output?.usageMetadata?.input_tokens || 0;
                        const output_tokens = agentFlowExecutedData?.data?.output?.usageMetadata?.output_tokens || 0;
                        const total_tokens = agentFlowExecutedData?.data?.output?.usageMetadata?.total_tokens || input_tokens + output_tokens;
                        const metrics = {
                            promptTokens: input_tokens,
                            completionTokens: output_tokens,
                            totalTokens: total_tokens,
                            provider: agentFlowExecutedData.data?.input?.llmModelConfig?.llmModel ||
                                agentFlowExecutedData.data?.input?.agentModelConfig?.agentModel,
                            model: agentFlowExecutedData.data?.input?.llmModelConfig?.modelName ||
                                agentFlowExecutedData.data?.input?.agentModelConfig?.modelName,
                            nodeLabel: agentFlowExecutedData?.nodeLabel,
                            nodeId: agentFlowExecutedData?.nodeId
                        };
                        if (metrics.provider && metrics.model) {
                            const modelConfig = await _a.getCostMetrics(metrics.provider, metrics.model);
                            if (modelConfig) {
                                metrics.cost_values = {
                                    input_cost: (modelConfig.cost_values.input_cost || 0) * (input_tokens / 1000),
                                    output_cost: (modelConfig.cost_values.output_cost || 0) * (output_tokens / 1000)
                                };
                                metrics.cost_values.total_cost = metrics.cost_values.input_cost + metrics.cost_values.output_cost;
                            }
                        }
                        agentFlowMetrics.push(metrics);
                    }
                }
                const endTime = performance.now();
                const timeTaken = (endTime - startTime).toFixed(2);
                if (response?.data?.metrics) {
                    runData.metrics = response.data.metrics;
                    runData.metrics.push({
                        apiLatency: timeTaken
                    });
                }
                else {
                    runData.metrics = [
                        {
                            apiLatency: timeTaken
                        }
                    ];
                }
                if (agentFlowMetrics.length > 0) {
                    runData.nested_metrics = agentFlowMetrics;
                }
                runData.status = 'complete';
                let resultText = '';
                if (response.data.text)
                    resultText = response.data.text;
                else if (response.data.json)
                    resultText = '```json\n' + JSON.stringify(response.data.json, null, 2);
                else
                    resultText = JSON.stringify(response.data, null, 2);
                runData.actualOutput = resultText;
                runData.latency = timeTaken;
                runData.error = '';
            }
            catch (error) {
                runData.status = 'error';
                runData.actualOutput = '';
                runData.error = error?.response?.data?.message
                    ? error.response.data.message
                    : error?.message
                        ? error.message
                        : 'Unknown error';
                try {
                    if (runData.error.indexOf('-') > -1) {
                        // if there is a dash, remove all content before
                        runData.error = 'Error: ' + runData.error.substr(runData.error.indexOf('-') + 1).trim();
                    }
                }
                catch (error) {
                    //stay silent
                }
                const endTime = performance.now();
                const timeTaken = (endTime - startTime).toFixed(2);
                runData.metrics = [
                    {
                        apiLatency: timeTaken
                    }
                ];
                runData.latency = timeTaken;
            }
            runData.uuid = uuid;
            returnData.rows[i].evaluations.push(runData);
        }
        return returnData;
    }
}
exports.EvaluationRunner = EvaluationRunner;
_a = EvaluationRunner;
EvaluationRunner.metrics = new Map();
EvaluationRunner.getCostMetrics = async (selectedProvider, selectedModel) => {
    let modelConfig = await (0, modelLoader_1.getModelConfigByModelName)(modelLoader_1.MODEL_TYPE.CHAT, selectedProvider, selectedModel);
    if (modelConfig) {
        if (modelConfig['cost_values']) {
            return modelConfig.cost_values;
        }
        return { cost_values: modelConfig };
    }
    else {
        modelConfig = await (0, modelLoader_1.getModelConfigByModelName)(modelLoader_1.MODEL_TYPE.LLM, selectedProvider, selectedModel);
        if (modelConfig) {
            if (modelConfig['cost_values']) {
                return modelConfig.cost_values;
            }
            return { cost_values: modelConfig };
        }
    }
    return undefined;
};
//# sourceMappingURL=EvaluationRunner.js.map