"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const jira_1 = require("@langchain/community/document_loaders/web/jira");
const src_1 = require("../../../src");
class Jira_DocumentLoaders {
    constructor() {
        this.label = 'Jira';
        this.name = 'jira';
        this.version = 1.0;
        this.type = 'Document';
        this.icon = 'jira.svg';
        this.category = 'Document Loaders';
        this.description = `Load issues from Jira`;
        this.baseClasses = [this.type];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            description: 'Jira API Credential',
            credentialNames: ['jiraApi']
        };
        this.inputs = [
            {
                label: 'Host',
                name: 'host',
                type: 'string',
                placeholder: 'https://jira.example.com'
            },
            {
                label: 'Project Key',
                name: 'projectKey',
                type: 'string',
                default: 'main'
            },
            {
                label: 'Limit per request',
                name: 'limitPerRequest',
                type: 'number',
                step: 1,
                optional: true,
                placeholder: '100'
            },
            {
                label: 'Created after',
                name: 'createdAfter',
                type: 'string',
                optional: true,
                placeholder: '2024-01-01'
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
        const host = nodeData.inputs?.host;
        const projectKey = nodeData.inputs?.projectKey;
        const limitPerRequest = nodeData.inputs?.limitPerRequest;
        const createdAfter = nodeData.inputs?.createdAfter;
        const textSplitter = nodeData.inputs?.textSplitter;
        const metadata = nodeData.inputs?.metadata;
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys;
        const output = nodeData.outputs?.output;
        let omitMetadataKeys = [];
        if (_omitMetadataKeys) {
            omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim());
        }
        const credentialData = await (0, src_1.getCredentialData)(nodeData.credential ?? '', options);
        const username = (0, src_1.getCredentialParam)('username', credentialData, nodeData);
        const accessToken = (0, src_1.getCredentialParam)('accessToken', credentialData, nodeData);
        const jiraOptions = {
            projectKey,
            host,
            username,
            accessToken
        };
        if (limitPerRequest) {
            jiraOptions.limitPerRequest = parseInt(limitPerRequest);
        }
        if (createdAfter) {
            jiraOptions.createdAfter = new Date(createdAfter);
        }
        const loader = new jira_1.JiraProjectLoader(jiraOptions);
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
module.exports = { nodeClass: Jira_DocumentLoaders };
//# sourceMappingURL=Jira.js.map