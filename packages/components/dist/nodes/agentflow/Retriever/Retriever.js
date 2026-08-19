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
const utils_1 = require("../utils");
const utils_2 = require("../../../src/utils");
class Retriever_Agentflow {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listRuntimeStateKeys(_, options) {
                const previousNodes = options.previousNodes;
                const startAgentflowNode = previousNodes.find((node) => node.name === 'startAgentflow');
                const state = startAgentflowNode?.inputs?.startState;
                return state.map((item) => ({ label: item.key, name: item.key }));
            },
            async listStores(_, options) {
                const returnData = [];
                const appDataSource = options.appDataSource;
                const databaseEntities = options.databaseEntities;
                if (appDataSource === undefined || !appDataSource) {
                    return returnData;
                }
                const searchOptions = options.searchOptions || {};
                const stores = await appDataSource.getRepository(databaseEntities['DocumentStore']).findBy(searchOptions);
                for (const store of stores) {
                    if (store.status === 'UPSERTED') {
                        const obj = {
                            name: `${store.id}:${store.name}`,
                            label: store.name,
                            description: store.description
                        };
                        returnData.push(obj);
                    }
                }
                return returnData;
            }
        };
        this.label = 'Retriever';
        this.name = 'retrieverAgentflow';
        this.version = 1.1;
        this.type = 'Retriever';
        this.category = 'Agent Flows';
        this.description = 'Retrieve information from vector database';
        this.baseClasses = [this.type];
        this.color = '#b8bedd';
        this.inputs = [
            {
                label: 'Knowledge (Document Stores)',
                name: 'retrieverKnowledgeDocumentStores',
                type: 'array',
                description: 'Document stores to retrieve information from. Document stores must be upserted in advance.',
                array: [
                    {
                        label: 'Document Store',
                        name: 'documentStore',
                        type: 'asyncOptions',
                        loadMethod: 'listStores'
                    }
                ]
            },
            {
                label: 'Retriever Query',
                name: 'retrieverQuery',
                type: 'string',
                placeholder: 'Enter your query here',
                rows: 4,
                acceptVariable: true
            },
            {
                label: 'Output Format',
                name: 'outputFormat',
                type: 'options',
                options: [
                    { label: 'Text', name: 'text' },
                    { label: 'Text with Metadata', name: 'textWithMetadata' }
                ],
                default: 'text'
            },
            {
                label: 'Update Flow State',
                name: 'retrieverUpdateState',
                description: 'Update runtime state during the execution of the workflow',
                type: 'array',
                optional: true,
                acceptVariable: true,
                array: [
                    {
                        label: 'Key',
                        name: 'key',
                        type: 'asyncOptions',
                        loadMethod: 'listRuntimeStateKeys'
                    },
                    {
                        label: 'Value',
                        name: 'value',
                        type: 'string',
                        acceptVariable: true,
                        acceptNodeOutputAsVariable: true
                    }
                ]
            }
        ];
    }
    async run(nodeData, input, options) {
        const retrieverQuery = nodeData.inputs?.retrieverQuery;
        const outputFormat = nodeData.inputs?.outputFormat;
        const _retrieverUpdateState = nodeData.inputs?.retrieverUpdateState;
        const state = options.agentflowRuntime?.state;
        const chatId = options.chatId;
        const isLastNode = options.isLastNode;
        const isStreamable = isLastNode && options.sseStreamer !== undefined;
        const abortController = options.abortController;
        // Extract knowledge
        let docs = [];
        const knowledgeBases = nodeData.inputs?.retrieverKnowledgeDocumentStores;
        if (knowledgeBases && knowledgeBases.length > 0) {
            for (const knowledgeBase of knowledgeBases) {
                const [storeId, _] = knowledgeBase.documentStore.split(':');
                const docStoreVectorInstanceFilePath = options.componentNodes['documentStoreVS'].filePath;
                const docStoreVectorModule = await Promise.resolve(`${docStoreVectorInstanceFilePath}`).then(s => __importStar(require(s)));
                const newDocStoreVectorInstance = new docStoreVectorModule.nodeClass();
                const docStoreVectorInstance = (await newDocStoreVectorInstance.init({
                    ...nodeData,
                    inputs: {
                        ...nodeData.inputs,
                        selectedStore: storeId
                    },
                    outputs: {
                        output: 'retriever'
                    }
                }, '', options));
                docs = await docStoreVectorInstance.invoke(retrieverQuery || input, { signal: abortController?.signal });
            }
        }
        const docsText = docs.map((doc) => doc.pageContent).join('\n');
        // Update flow state if needed
        let newState = { ...state };
        if (_retrieverUpdateState && Array.isArray(_retrieverUpdateState) && _retrieverUpdateState.length > 0) {
            newState = (0, utils_1.updateFlowState)(state, _retrieverUpdateState);
        }
        try {
            let finalOutput = '';
            if (outputFormat === 'text') {
                finalOutput = docsText;
            }
            else if (outputFormat === 'textWithMetadata') {
                finalOutput = JSON.stringify(docs, null, 2);
            }
            if (isStreamable) {
                const sseStreamer = options.sseStreamer;
                sseStreamer.streamTokenEvent(chatId, finalOutput);
            }
            newState = (0, utils_2.processTemplateVariables)(newState, finalOutput);
            const returnOutput = {
                id: nodeData.id,
                name: this.name,
                input: {
                    question: retrieverQuery || input
                },
                output: {
                    content: finalOutput
                },
                state: newState
            };
            return returnOutput;
        }
        catch (e) {
            throw new Error(e);
        }
    }
}
module.exports = { nodeClass: Retriever_Agentflow };
//# sourceMappingURL=Retriever.js.map