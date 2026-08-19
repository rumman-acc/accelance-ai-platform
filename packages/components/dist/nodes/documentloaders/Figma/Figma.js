"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const src_1 = require("../../../src");
const figma_1 = require("@langchain/community/document_loaders/web/figma");
class Figma_DocumentLoaders {
    constructor() {
        this.label = 'Figma';
        this.name = 'figma';
        this.version = 2.0;
        this.type = 'Document';
        this.icon = 'figma.svg';
        this.category = 'Document Loaders';
        this.description = 'Load data from a Figma file';
        this.baseClasses = [this.type];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['figmaApi']
        };
        this.inputs = [
            {
                label: 'File Key',
                name: 'fileKey',
                type: 'string',
                placeholder: 'key',
                description: 'The file key can be read from any Figma file URL: https://www.figma.com/file/:key/:title. For example, in https://www.figma.com/file/12345/Website, the file key is 12345'
            },
            {
                label: 'Node IDs',
                name: 'nodeIds',
                type: 'string',
                placeholder: '0, 1, 2',
                description: 'A list of Node IDs, seperated by comma. Refer to <a target="_blank" href="https://www.figma.com/community/plugin/758276196886757462/Node-Inspector">official guide</a> on how to get Node IDs'
            },
            {
                label: 'Recursive',
                name: 'recursive',
                type: 'boolean',
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
    async init(nodeData, _, options) {
        const nodeIds = nodeData.inputs?.nodeIds?.trim().split(',') || [];
        const fileKey = nodeData.inputs?.fileKey;
        const textSplitter = nodeData.inputs?.textSplitter;
        const metadata = nodeData.inputs?.metadata;
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys;
        const output = nodeData.outputs?.output;
        let omitMetadataKeys = [];
        if (_omitMetadataKeys) {
            omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim());
        }
        const credentialData = await (0, src_1.getCredentialData)(nodeData.credential ?? '', options);
        const accessToken = (0, src_1.getCredentialParam)('accessToken', credentialData, nodeData);
        const figmaOptions = {
            accessToken,
            nodeIds,
            fileKey
        };
        const loader = new figma_1.FigmaFileLoader(figmaOptions);
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
module.exports = { nodeClass: Figma_DocumentLoaders };
//# sourceMappingURL=Figma.js.map