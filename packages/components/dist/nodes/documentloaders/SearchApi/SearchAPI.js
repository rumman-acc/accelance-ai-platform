"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const searchapi_1 = require("@langchain/community/document_loaders/web/searchapi");
const src_1 = require("../../../src");
// Provides access to multiple search engines using the SearchApi.
// For available parameters & engines, refer to: https://www.searchapi.io/docs/google
class SearchAPI_DocumentLoaders {
    constructor() {
        this.label = 'SearchApi For Web Search';
        this.name = 'searchApi';
        this.version = 2.0;
        this.type = 'Document';
        this.icon = 'searchapi.svg';
        this.category = 'Document Loaders';
        this.description = 'Load data from real-time search results';
        this.baseClasses = [this.type];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            optional: false,
            credentialNames: ['searchApi']
        };
        this.inputs = [
            {
                label: 'Query',
                name: 'query',
                type: 'string',
                optional: true
            },
            {
                label: 'Custom Parameters',
                name: 'customParameters',
                type: 'json',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Additional Metadata',
                name: 'metadata',
                type: 'json',
                description: 'Additional metadata to be added to the extracted documents',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Omit Metadata Keys',
                name: 'omitMetadataKeys',
                type: 'string',
                rows: 4,
                description: 'Each document loader comes with a default set of metadata keys that are extracted from the document. You can use this field to omit some of the default metadata keys. The value should be a list of keys, seperated by comma. Use * to omit all metadata keys execept the ones you specify in the Additional Metadata field',
                placeholder: 'key1, key2, key3.nestedKey1',
                optional: true,
                additionalParams: true
            }
        ];
        this.outputs = [
            {
                label: 'Document',
                name: 'document',
                description: 'Array of document objects containing metadata and pageContent',
                baseClasses: [...this.baseClasses, 'json']
            },
            {
                label: 'Text',
                name: 'text',
                description: 'Concatenated string from pageContent of documents',
                baseClasses: ['string', 'json']
            }
        ];
    }
    async init(nodeData, _, options) {
        const textSplitter = nodeData.inputs?.textSplitter;
        const query = nodeData.inputs?.query;
        const customParameters = nodeData.inputs?.customParameters;
        const metadata = nodeData.inputs?.metadata;
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys;
        const output = nodeData.outputs?.output;
        let omitMetadataKeys = [];
        if (_omitMetadataKeys) {
            omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim());
        }
        // Fetch the API credentials for this node
        const credentialData = await (0, src_1.getCredentialData)(nodeData.credential ?? '', options);
        const searchApiKey = (0, src_1.getCredentialParam)('searchApiKey', credentialData, nodeData);
        // Check and parse custom parameters (should be JSON or object)
        const parsedParameters = typeof customParameters === 'object' ? customParameters : JSON.parse(customParameters || '{}');
        // Prepare the configuration for the SearchApiLoader
        const loaderConfig = {
            q: query,
            apiKey: searchApiKey,
            ...parsedParameters
        };
        // Initialize the loader with the given configuration
        const loader = new searchapi_1.SearchApiLoader(loaderConfig);
        // Fetch documents, split if a text splitter is provided
        let docs = [];
        if (textSplitter) {
            docs = await loader.load();
            docs = await textSplitter.splitDocuments(docs);
        }
        else {
            docs = await loader.load();
        }
        if (metadata) {
            const parsedMetadata = typeof metadata === 'object' ? metadata : JSON.parse(metadata);
            docs = docs.map((doc) => ({
                ...doc,
                metadata: _omitMetadataKeys === '*'
                    ? {
                        ...parsedMetadata
                    }
                    : (0, lodash_1.omit)({
                        ...doc.metadata,
                        ...parsedMetadata
                    }, omitMetadataKeys)
            }));
        }
        else {
            docs = docs.map((doc) => ({
                ...doc,
                metadata: _omitMetadataKeys === '*'
                    ? {}
                    : (0, lodash_1.omit)({
                        ...doc.metadata
                    }, omitMetadataKeys)
            }));
        }
        if (output === 'document') {
            return docs;
        }
        else {
            let finaltext = '';
            for (const doc of docs) {
                finaltext += `${doc.pageContent}\n`;
            }
            return (0, src_1.handleEscapeCharacters)(finaltext, false);
        }
    }
}
module.exports = { nodeClass: SearchAPI_DocumentLoaders };
//# sourceMappingURL=SearchAPI.js.map