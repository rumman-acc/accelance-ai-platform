"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const notionapi_1 = require("@langchain/community/document_loaders/web/notionapi");
const src_1 = require("../../../src");
const notionTableFix_1 = require("./notionTableFix");
class NotionDB_DocumentLoaders {
    constructor() {
        this.label = 'Notion Database';
        this.name = 'notionDB';
        this.version = 2.0;
        this.type = 'Document';
        this.icon = 'notion-db.svg';
        this.category = 'Document Loaders';
        this.description = 'Load data from Notion Database (each row is a separate document with all properties as metadata)';
        this.baseClasses = [this.type];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['notionApi']
        };
        this.inputs = [
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Notion Database Id',
                name: 'databaseId',
                type: 'string',
                description: 'If your URL looks like - https://www.notion.so/abcdefh?v=long_hash_2, then abcdefh is the database ID'
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
        const databaseId = nodeData.inputs?.databaseId;
        const metadata = nodeData.inputs?.metadata;
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys;
        const output = nodeData.outputs?.output;
        let omitMetadataKeys = [];
        if (_omitMetadataKeys) {
            omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim());
        }
        const credentialData = await (0, src_1.getCredentialData)(nodeData.credential ?? '', options);
        const notionIntegrationToken = (0, src_1.getCredentialParam)('notionIntegrationToken', credentialData, nodeData);
        const obj = {
            clientOptions: {
                auth: notionIntegrationToken
            },
            id: databaseId,
            callerOptions: {
                maxConcurrency: 64 // Default value
            },
            propertiesAsHeader: true, // Prepends a front matter header of the page properties to the page contents
            type: 'database'
        };
        const loader = new notionapi_1.NotionAPILoader(obj);
        (0, notionTableFix_1.applyCompactTableTransformer)(loader);
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
module.exports = { nodeClass: NotionDB_DocumentLoaders };
//# sourceMappingURL=NotionDB.js.map