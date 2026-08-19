"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const gitbook_1 = require("@langchain/community/document_loaders/web/gitbook");
const utils_1 = require("../../../src/utils");
class Gitbook_DocumentLoaders {
    constructor() {
        this.label = 'GitBook';
        this.name = 'gitbook';
        this.version = 2.0;
        this.type = 'Document';
        this.icon = 'gitbook.svg';
        this.category = 'Document Loaders';
        this.description = `Load data from GitBook`;
        this.baseClasses = [this.type];
        this.inputs = [
            {
                label: 'Web Path',
                name: 'webPath',
                type: 'string',
                placeholder: 'https://docs.gitbook.com/product-tour/navigation',
                description: 'If want to load all paths from the GitBook provide only root path e.g.https://docs.gitbook.com/ '
            },
            {
                label: 'Should Load All Paths',
                name: 'shouldLoadAllPaths',
                type: 'boolean',
                description: 'Load from all paths in a given GitBook',
                optional: true
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
    async init(nodeData) {
        const webPath = nodeData.inputs?.webPath;
        const shouldLoadAllPaths = nodeData.inputs?.shouldLoadAllPaths;
        const textSplitter = nodeData.inputs?.textSplitter;
        const metadata = nodeData.inputs?.metadata;
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys;
        const output = nodeData.outputs?.output;
        let omitMetadataKeys = [];
        if (_omitMetadataKeys) {
            omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim());
        }
        const loader = shouldLoadAllPaths ? new gitbook_1.GitbookLoader(webPath, { shouldLoadAllPaths }) : new gitbook_1.GitbookLoader(webPath);
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
            return (0, utils_1.handleEscapeCharacters)(finaltext, false);
        }
    }
}
module.exports = {
    nodeClass: Gitbook_DocumentLoaders
};
//# sourceMappingURL=Gitbook.js.map