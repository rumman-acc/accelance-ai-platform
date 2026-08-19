'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const prompts_1 = require('@langchain/core/prompts')
const multi_query_1 = require('@langchain/classic/retrievers/multi_query')
const defaultPrompt = `You are an AI language model assistant. Your task is
to generate 3 different versions of the given user
question to retrieve relevant documents from a vector database.
By generating multiple perspectives on the user question,
your goal is to help the user overcome some of the limitations
of distance-based similarity search.

Provide these alternative questions separated by newlines between XML tags. For example:

<questions>
Question 1
Question 2
Question 3
</questions>

Original question: {question}`
class MultiQueryRetriever_Retrievers {
    constructor() {
        this.label = 'Multi Query Retriever'
        this.name = 'multiQueryRetriever'
        this.version = 1.0
        this.type = 'MultiQueryRetriever'
        this.icon = 'multiQueryRetriever.svg'
        this.category = 'Retrievers'
        this.description = 'Generate multiple queries from different perspectives for a given user input query'
        this.baseClasses = [this.type, 'BaseRetriever']
        this.inputs = [
            {
                label: 'Vector Store',
                name: 'vectorStore',
                type: 'VectorStore'
            },
            {
                label: 'Language Model',
                name: 'model',
                type: 'BaseLanguageModel'
            },
            {
                label: 'Prompt',
                name: 'modelPrompt',
                description:
                    'Prompt for the language model to generate alternative questions. Use {question} to refer to the original question',
                type: 'string',
                rows: 4,
                default: defaultPrompt
            }
        ]
    }
    async init(nodeData, input) {
        const model = nodeData.inputs?.model
        const vectorStore = nodeData.inputs?.vectorStore
        let prompt = nodeData.inputs?.modelPrompt || defaultPrompt
        prompt = prompt.replaceAll('{question}', input)
        const retriever = multi_query_1.MultiQueryRetriever.fromLLM({
            llm: model,
            retriever: vectorStore.asRetriever({ filter: vectorStore?.lc_kwargs?.filter ?? vectorStore?.filter }),
            verbose: process.env.DEBUG === 'true',
            // @ts-ignore
            prompt: prompts_1.PromptTemplate.fromTemplate(prompt)
        })
        return retriever
    }
}
module.exports = { nodeClass: MultiQueryRetriever_Retrievers }
//# sourceMappingURL=MultiQueryRetriever.js.map
