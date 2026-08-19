"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const brave_search_1 = require("@langchain/community/tools/brave_search");
const utils_1 = require("../../../src/utils");
const documents_1 = require("@langchain/core/documents");
class BraveSearchAPI_DocumentLoaders {
    constructor() {
        this.label = 'BraveSearch API Document Loader';
        this.name = 'braveSearchApiLoader';
        this.version = 2.0;
        this.type = 'Document';
        this.icon = 'brave.svg';
        this.category = 'Document Loaders';
        this.description = 'Load and process data from BraveSearch results';
        this.baseClasses = [this.type];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            optional: false,
            credentialNames: ['braveSearchApi']
        };
        this.inputs = [
            {
                label: 'Query',
                name: 'query',
                type: 'string'
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
                description: 'Each document loader comes with a default set of metadata keys that are extracted from the document. You can use this field to omit some of the default metadata keys. The value should be a list of keys, separated by comma. Use * to omit all metadata keys except the ones you specify in the Additional Metadata field',
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
        const metadata = nodeData.inputs?.metadata;
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys;
        const output = nodeData.outputs?.output;
        let omitMetadataKeys = [];
        if (_omitMetadataKeys) {
            omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim());
        }
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const braveApiKey = (0, utils_1.getCredentialParam)('braveApiKey', credentialData, nodeData);
        const loader = new brave_search_1.BraveSearch({ apiKey: braveApiKey });
        let docs = [];
        const searchResults = await loader._call(query); // Use _call method for search
        const parsedResults = JSON.parse(searchResults); // Parse the JSON string to get documents
        // Format the results to match the expected Document structure
        docs = parsedResults.map((result) => new documents_1.Document({
            pageContent: result.snippet, // Assuming snippet is the content
            metadata: {
                title: result.title,
                link: result.link
            }
        }));
        if (textSplitter) {
            docs = await textSplitter.splitDocuments(docs);
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
            return (0, utils_1.handleEscapeCharacters)(finaltext, false);
        }
    }
}
module.exports = { nodeClass: BraveSearchAPI_DocumentLoaders };
//# sourceMappingURL=BraveSearchAPI.js.map