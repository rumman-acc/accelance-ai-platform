"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.howToUseFileUpload = exports.addMMRInputParams = exports.resolveVectorStoreOrRetriever = void 0;
const resolveVectorStoreOrRetriever = (nodeData, vectorStore, metadataFilter) => {
    const output = nodeData.outputs?.output;
    const searchType = nodeData.outputs?.searchType;
    const topK = nodeData.inputs?.topK;
    const k = topK ? parseFloat(topK) : 4;
    const alpha = nodeData.inputs?.alpha;
    // If it is already pre-defined in lc_kwargs, then don't pass it again
    const filter = vectorStore?.lc_kwargs?.filter ? undefined : metadataFilter;
    if (output === 'retriever') {
        const searchKwargs = {};
        if (alpha !== undefined) {
            searchKwargs.alpha = parseFloat(alpha);
        }
        if ('mmr' === searchType) {
            const fetchK = nodeData.inputs?.fetchK;
            const lambda = nodeData.inputs?.lambda;
            const f = fetchK ? parseInt(fetchK) : 20;
            const l = lambda ? parseFloat(lambda) : 0.5;
            return vectorStore.asRetriever({
                searchType: 'mmr',
                k: k,
                filter,
                searchKwargs: {
                    //...searchKwargs,
                    fetchK: f,
                    lambda: l
                }
            });
        }
        else {
            // "searchType" is "similarity"
            return vectorStore.asRetriever({
                k: k,
                filter: filter,
                searchKwargs: Object.keys(searchKwargs).length > 0 ? searchKwargs : undefined
            });
        }
    }
    else if (output === 'vectorStore') {
        ;
        vectorStore.k = k;
        vectorStore.filter = filter;
        return vectorStore;
    }
};
exports.resolveVectorStoreOrRetriever = resolveVectorStoreOrRetriever;
const addMMRInputParams = (inputs) => {
    const mmrInputParams = [
        {
            label: 'Search Type',
            name: 'searchType',
            type: 'options',
            default: 'similarity',
            options: [
                {
                    label: 'Similarity',
                    name: 'similarity'
                },
                {
                    label: 'Max Marginal Relevance',
                    name: 'mmr'
                }
            ],
            additionalParams: true,
            optional: true
        },
        {
            label: 'Fetch K (for MMR Search)',
            name: 'fetchK',
            description: 'Number of initial documents to fetch for MMR reranking. Default to 20. Used only when the search type is MMR',
            placeholder: '20',
            type: 'number',
            additionalParams: true,
            optional: true
        },
        {
            label: 'Lambda (for MMR Search)',
            name: 'lambda',
            description: 'Number between 0 and 1 that determines the degree of diversity among the results, where 0 corresponds to maximum diversity and 1 to minimum diversity. Used only when the search type is MMR',
            placeholder: '0.5',
            type: 'number',
            additionalParams: true,
            optional: true
        }
    ];
    inputs.push(...mmrInputParams);
};
exports.addMMRInputParams = addMMRInputParams;
exports.howToUseFileUpload = `
**File Upload**

This allows file upload on the chat. Uploaded files will be upserted on the fly to the vector store.

**Note:**
- You can only turn on file upload for one vector store at a time.
- At least one Document Loader node should be connected to the document input.
- Document Loader should be file types like PDF, DOCX, TXT, etc.

**How it works**
- Uploaded files will have the metadata updated with the chatId.
- This will allow the file to be associated with the chatId.
- When querying, metadata will be filtered by chatId to retrieve files associated with the chatId.
`;
//# sourceMappingURL=VectorStoreUtils.js.map