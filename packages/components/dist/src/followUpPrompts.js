"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFollowUpPrompts = void 0;
const Interface_1 = require("./Interface");
const utils_1 = require("./utils");
const anthropic_1 = require("@langchain/anthropic");
const google_genai_1 = require("@langchain/google-genai");
const mistralai_1 = require("@langchain/mistralai");
const openai_1 = require("@langchain/openai");
const v3_1 = require("zod/v3");
const prompts_1 = require("@langchain/core/prompts");
const output_parsers_1 = require("@langchain/core/output_parsers");
const groq_1 = require("@langchain/groq");
const ollama_1 = require("ollama");
const FollowUpPromptType = v3_1.z
    .object({
    questions: v3_1.z.array(v3_1.z.string())
})
    .describe('Generate Follow Up Prompts');
const generateFollowUpPrompts = async (followUpPromptsConfig, apiMessageContent, options) => {
    if (followUpPromptsConfig) {
        if (!followUpPromptsConfig.status)
            return undefined;
        const providerConfig = followUpPromptsConfig[followUpPromptsConfig.selectedProvider];
        if (!providerConfig)
            return undefined;
        const credentialId = providerConfig.credentialId;
        const credentialData = await (0, utils_1.getCredentialData)(credentialId ?? '', options);
        const followUpPromptsPrompt = providerConfig.prompt.replace('{history}', apiMessageContent);
        switch (followUpPromptsConfig.selectedProvider) {
            case Interface_1.FollowUpPromptProvider.ANTHROPIC: {
                const llm = new anthropic_1.ChatAnthropic({
                    apiKey: credentialData.anthropicApiKey,
                    model: providerConfig.modelName,
                    temperature: parseFloat(`${providerConfig.temperature}`)
                });
                // @ts-ignore
                const structuredLLM = llm.withStructuredOutput(FollowUpPromptType, {
                    method: 'functionCalling'
                });
                const structuredResponse = await structuredLLM.invoke(followUpPromptsPrompt);
                return structuredResponse;
            }
            case Interface_1.FollowUpPromptProvider.AZURE_OPENAI: {
                const azureOpenAIApiKey = credentialData['azureOpenAIApiKey'];
                const azureOpenAIApiInstanceName = credentialData['azureOpenAIApiInstanceName'];
                const azureOpenAIApiDeploymentName = credentialData['azureOpenAIApiDeploymentName'];
                const azureOpenAIApiVersion = credentialData['azureOpenAIApiVersion'];
                const llm = new openai_1.AzureChatOpenAI({
                    azureOpenAIApiKey,
                    azureOpenAIApiInstanceName,
                    azureOpenAIApiDeploymentName,
                    azureOpenAIApiVersion,
                    model: providerConfig.modelName,
                    temperature: parseFloat(`${providerConfig.temperature}`)
                });
                // use structured output parser because withStructuredOutput is not working
                const parser = output_parsers_1.StructuredOutputParser.fromZodSchema(FollowUpPromptType);
                const formatInstructions = parser.getFormatInstructions();
                const prompt = prompts_1.PromptTemplate.fromTemplate(`
                    ${providerConfig.prompt}
                                
                    {format_instructions}
                `);
                const chain = prompt.pipe(llm).pipe(parser);
                const structuredResponse = await chain.invoke({
                    history: apiMessageContent,
                    format_instructions: formatInstructions
                });
                return structuredResponse;
            }
            case Interface_1.FollowUpPromptProvider.GOOGLE_GENAI: {
                const model = new google_genai_1.ChatGoogleGenerativeAI({
                    apiKey: credentialData.googleGenerativeAPIKey,
                    model: providerConfig.modelName,
                    temperature: parseFloat(`${providerConfig.temperature}`)
                });
                const structuredLLM = model.withStructuredOutput(FollowUpPromptType, {
                    method: 'functionCalling'
                });
                const structuredResponse = await structuredLLM.invoke(followUpPromptsPrompt);
                return structuredResponse;
            }
            case Interface_1.FollowUpPromptProvider.MISTRALAI: {
                const model = new mistralai_1.ChatMistralAI({
                    apiKey: credentialData.mistralAIAPIKey,
                    model: providerConfig.modelName,
                    temperature: parseFloat(`${providerConfig.temperature}`)
                });
                // @ts-ignore
                const structuredLLM = model.withStructuredOutput(FollowUpPromptType, {
                    method: 'functionCalling'
                });
                const structuredResponse = await structuredLLM.invoke(followUpPromptsPrompt);
                return structuredResponse;
            }
            case Interface_1.FollowUpPromptProvider.OPENAI: {
                const model = new openai_1.ChatOpenAI({
                    apiKey: credentialData.openAIApiKey,
                    model: providerConfig.modelName,
                    temperature: parseFloat(`${providerConfig.temperature}`),
                    useResponsesApi: true
                });
                // @ts-ignore
                const structuredLLM = model.withStructuredOutput(FollowUpPromptType, {
                    method: 'functionCalling'
                });
                const structuredResponse = await structuredLLM.invoke(followUpPromptsPrompt);
                return structuredResponse;
            }
            case Interface_1.FollowUpPromptProvider.GROQ: {
                const llm = new groq_1.ChatGroq({
                    apiKey: credentialData.groqApiKey,
                    model: providerConfig.modelName,
                    temperature: parseFloat(`${providerConfig.temperature}`)
                });
                const structuredLLM = llm.withStructuredOutput(FollowUpPromptType, {
                    method: 'functionCalling'
                });
                const structuredResponse = await structuredLLM.invoke(followUpPromptsPrompt);
                return structuredResponse;
            }
            case Interface_1.FollowUpPromptProvider.OLLAMA: {
                const ollamaClient = new ollama_1.Ollama({
                    host: providerConfig.baseUrl || 'http://127.0.0.1:11434'
                });
                const response = await ollamaClient.chat({
                    model: providerConfig.modelName,
                    messages: [
                        {
                            role: 'user',
                            content: followUpPromptsPrompt
                        }
                    ],
                    format: {
                        type: 'object',
                        properties: {
                            questions: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                minItems: 3,
                                maxItems: 3,
                                description: 'Three follow-up questions based on the conversation history'
                            }
                        },
                        required: ['questions'],
                        additionalProperties: false
                    },
                    options: {
                        temperature: parseFloat(`${providerConfig.temperature}`)
                    }
                });
                const result = FollowUpPromptType.parse(JSON.parse(response.message.content));
                return result;
            }
        }
    }
    else {
        return undefined;
    }
};
exports.generateFollowUpPrompts = generateFollowUpPrompts;
//# sourceMappingURL=followUpPrompts.js.map