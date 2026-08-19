'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const aws_1 = require('@langchain/aws')
const awsToolsUtils_1 = require('../../../src/awsToolsUtils')
const modelLoader_1 = require('../../../src/modelLoader')
class AWSBedrockKBRetriever_Retrievers {
    constructor() {
        this.loadMethods = {
            // Reuse the AWS Bedrock Embeddings region list as it should be same for all Bedrock functions
            async listRegions() {
                return await (0, modelLoader_1.getRegions)(modelLoader_1.MODEL_TYPE.EMBEDDING, 'AWSBedrockEmbeddings')
            }
        }
        this.label = 'AWS Bedrock Knowledge Base Retriever'
        this.name = 'awsBedrockKBRetriever'
        this.version = 1.0
        this.type = 'AWSBedrockKBRetriever'
        this.icon = 'AWSBedrockKBRetriever.svg'
        this.category = 'Retrievers'
        this.description = 'Connect to AWS Bedrock Knowledge Base API and retrieve relevant chunks'
        this.baseClasses = [this.type, 'BaseRetriever']
        this.credential = {
            label: 'AWS Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['awsApi'],
            optional: true
        }
        this.inputs = [
            {
                label: 'Region',
                name: 'region',
                type: 'asyncOptions',
                loadMethod: 'listRegions',
                default: 'us-east-1'
            },
            {
                label: 'Knowledge Base ID',
                name: 'knoledgeBaseID',
                type: 'string'
            },
            {
                label: 'Query',
                name: 'query',
                type: 'string',
                description: 'Query to retrieve documents from retriever. If not specified, user question will be used',
                optional: true,
                acceptVariable: true
            },
            {
                label: 'TopK',
                name: 'topK',
                type: 'number',
                description: 'Number of chunks to retrieve',
                optional: true,
                additionalParams: true,
                default: 5
            },
            {
                label: 'SearchType',
                name: 'searchType',
                type: 'options',
                description:
                    'Knowledge Base search type. Possible values are HYBRID and SEMANTIC. If not specified, default will be used. Consult AWS documentation for more',
                options: [
                    {
                        label: 'HYBRID',
                        name: 'HYBRID',
                        description: 'Hybrid seach type'
                    },
                    {
                        label: 'SEMANTIC',
                        name: 'SEMANTIC',
                        description: 'Semantic seach type'
                    }
                ],
                optional: true,
                additionalParams: true,
                default: undefined
            },
            {
                label: 'Filter',
                name: 'filter',
                type: 'string',
                description: 'Knowledge Base retrieval filter. Read documentation for filter syntax',
                optional: true,
                additionalParams: true
            }
        ]
    }
    async init(nodeData, input, options) {
        const knoledgeBaseID = nodeData.inputs?.knoledgeBaseID
        const region = nodeData.inputs?.region
        const topK = nodeData.inputs?.topK
        const overrideSearchType = nodeData.inputs?.searchType != '' ? nodeData.inputs?.searchType : undefined
        const filter = nodeData.inputs?.filter != '' ? JSON.parse(nodeData.inputs?.filter) : undefined
        const credentialConfig = await (0, awsToolsUtils_1.getAWSCredentialConfig)(nodeData, options, region)
        const retriever = new aws_1.AmazonKnowledgeBaseRetriever({
            topK,
            knowledgeBaseId: knoledgeBaseID,
            region,
            filter,
            overrideSearchType,
            clientOptions: {
                ...(credentialConfig.credentials && { credentials: credentialConfig.credentials })
            }
        })
        return retriever
    }
}
module.exports = { nodeClass: AWSBedrockKBRetriever_Retrievers }
//# sourceMappingURL=AWSBedrockKBRetriever.js.map
