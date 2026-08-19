"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMEvaluationRunner = void 0;
const accelance_components_1 = require("accelance-components");
const v3_1 = require("zod/v3");
const runnables_1 = require("@langchain/core/runnables");
const prompts_1 = require("@langchain/core/prompts");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const utils_1 = require("../../utils");
class LLMEvaluationRunner {
    async runLLMEvaluators(data, actualOutputArray, errorArray, llmEvaluatorMap) {
        const evaluationResults = [];
        if (this.llm === undefined) {
            this.llm = await this.createLLM(data);
        }
        for (let j = 0; j < actualOutputArray.length; j++) {
            const actualOutput = actualOutputArray[j];
            for (let i = 0; i < llmEvaluatorMap.length; i++) {
                if (errorArray[j] !== '') {
                    evaluationResults.push({
                        error: 'Not Graded!'
                    });
                    continue;
                }
                try {
                    const llmEvaluator = llmEvaluatorMap[i];
                    let evaluator = llmEvaluator.evaluator;
                    const schema = v3_1.z.object((0, accelance_components_1.convertSchemaToZod)(JSON.stringify(evaluator.outputSchema)));
                    const modelWithStructuredOutput = this.llm.withStructuredOutput(schema, {
                        method: 'functionCalling'
                    });
                    const llmExecutor = runnables_1.RunnableSequence.from([
                        prompts_1.PromptTemplate.fromTemplate(evaluator.prompt),
                        modelWithStructuredOutput
                    ]);
                    const response = await llmExecutor.invoke({
                        question: data.input,
                        actualOutput: actualOutput,
                        expectedOutput: data.expectedOutput
                    });
                    evaluationResults.push(response);
                }
                catch (error) {
                    evaluationResults.push({
                        error: 'error'
                    });
                }
            }
        }
        return evaluationResults;
    }
    async createLLM(data) {
        try {
            const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
            const nodeInstanceFilePath = appServer.nodesPool.componentNodes[data.llmConfig.llm].filePath;
            const nodeModule = await Promise.resolve(`${nodeInstanceFilePath}`).then(s => __importStar(require(s)));
            const newNodeInstance = new nodeModule.nodeClass();
            let nodeData = {
                inputs: { modelName: data.llmConfig.model },
                credential: data.llmConfig.credentialId,
                id: 'llm_0'
            };
            const options = {
                appDataSource: appServer.AppDataSource,
                databaseEntities: utils_1.databaseEntities
            };
            return await newNodeInstance.init(nodeData, undefined, options);
        }
        catch (error) {
            throw new Error('Error creating LLM');
        }
    }
}
exports.LLMEvaluationRunner = LLMEvaluationRunner;
//# sourceMappingURL=LLMEvaluationRunner.js.map