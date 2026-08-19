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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const jsonpointer_1 = __importDefault(require("jsonpointer"));
const src_1 = require("../../../src");
const base_1 = require("@langchain/classic/document_loaders/base");
const documents_1 = require("@langchain/core/documents");
const howToUseCode = `
You can add metadata dynamically from the document:

For example, if the document is:
\`\`\`jsonl
{
    "source": "www.example.com", "content": "Hello World!"
}
{
    "source": "www.example2.com", "content": "Hi World!"
}
\`\`\`

You can have the "source" value as metadata by returning the following:
\`\`\`json
{
    "source": "/source"
}
\`\`\``;
class Jsonlines_DocumentLoaders {
    constructor() {
        this.label = 'Json Lines File';
        this.name = 'jsonlinesFile';
        this.version = 3.0;
        this.type = 'Document';
        this.icon = 'jsonlines.svg';
        this.category = 'Document Loaders';
        this.description = `Load data from JSON Lines files`;
        this.baseClasses = [this.type];
        this.inputs = [
            {
                label: 'Jsonlines File',
                name: 'jsonlinesFile',
                type: 'file',
                fileType: '.jsonl'
            },
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Pointer Extraction',
                name: 'pointerName',
                type: 'string',
                placeholder: 'key',
                description: 'Ex: { "key": "value" }, Pointer Extraction = "key", "value" will be extracted as pageContent of the chunk',
                optional: false
            },
            {
                label: 'Additional Metadata',
                name: 'metadata',
                type: 'json',
                description: 'Additional metadata to be added to the extracted documents. You can add metadata dynamically from the document. Ex: { "key": "value", "source": "www.example.com" }. Metadata: { "page": "/source" } will extract the value of the key "source" from the document and add it to the metadata with the key "page"',
                hint: {
                    label: 'How to use',
                    value: howToUseCode
                },
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
        const jsonLinesFileBase64 = nodeData.inputs?.jsonlinesFile;
        const pointerName = nodeData.inputs?.pointerName;
        const metadata = nodeData.inputs?.metadata;
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys;
        const output = nodeData.outputs?.output;
        let omitMetadataKeys = [];
        if (_omitMetadataKeys) {
            omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim());
        }
        let docs = [];
        let files = [];
        let pointer = '/' + pointerName.trim();
        //FILE-STORAGE::["CONTRIBUTING.md","LICENSE.md","README.md"]
        if (jsonLinesFileBase64.startsWith('FILE-STORAGE::')) {
            const fileName = jsonLinesFileBase64.replace('FILE-STORAGE::', '');
            if (fileName.startsWith('[') && fileName.endsWith(']')) {
                files = JSON.parse(fileName);
            }
            else {
                files = [fileName];
            }
            const orgId = options.orgId;
            const chatflowid = options.chatflowid;
            for (const file of files) {
                if (!file)
                    continue;
                const fileData = await (0, src_1.getFileFromStorage)(file, orgId, chatflowid);
                const blob = new Blob([new Uint8Array(fileData)]);
                const loader = new JSONLinesLoader(blob, pointer, metadata);
                if (textSplitter) {
                    let splittedDocs = await loader.load();
                    splittedDocs = await textSplitter.splitDocuments(splittedDocs);
                    docs.push(...splittedDocs);
                }
                else {
                    docs.push(...(await loader.load()));
                }
            }
        }
        else {
            if (jsonLinesFileBase64.startsWith('[') && jsonLinesFileBase64.endsWith(']')) {
                files = JSON.parse(jsonLinesFileBase64);
            }
            else {
                files = [jsonLinesFileBase64];
            }
            for (const file of files) {
                if (!file)
                    continue;
                const splitDataURI = file.split(',');
                splitDataURI.pop();
                const bf = Buffer.from(splitDataURI.pop() || '', 'base64');
                const blob = new Blob([bf]);
                const loader = new JSONLinesLoader(blob, pointer, metadata);
                if (textSplitter) {
                    let splittedDocs = await loader.load();
                    splittedDocs = await textSplitter.splitDocuments(splittedDocs);
                    docs.push(...splittedDocs);
                }
                else {
                    docs.push(...(await loader.load()));
                }
            }
        }
        if (metadata) {
            let parsedMetadata = typeof metadata === 'object' ? metadata : JSON.parse(metadata);
            parsedMetadata = removeValuesStartingWithSlash(parsedMetadata);
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
const removeValuesStartingWithSlash = (obj) => {
    const result = {};
    for (const key in obj) {
        const value = obj[key];
        if (typeof value === 'string' && value.startsWith('/')) {
            continue;
        }
        result[key] = value;
    }
    return result;
};
class TextLoader extends base_1.BaseDocumentLoader {
    constructor(filePathOrBlob) {
        super();
        this.filePathOrBlob = filePathOrBlob;
    }
    async parse(raw) {
        return [{ pageContent: raw, metadata: {} }];
    }
    async load() {
        let text;
        let metadata;
        if (typeof this.filePathOrBlob === 'string') {
            const { readFile } = await TextLoader.imports();
            text = await readFile(this.filePathOrBlob, 'utf8');
            metadata = { source: this.filePathOrBlob };
        }
        else {
            text = await this.filePathOrBlob.text();
            metadata = { source: 'blob', blobType: this.filePathOrBlob.type };
        }
        const parsed = await this.parse(text);
        parsed.forEach((parsedData, i) => {
            const { pageContent } = parsedData;
            if (typeof pageContent !== 'string') {
                throw new Error(`Expected string, at position ${i} got ${typeof pageContent}`);
            }
        });
        return parsed.map((parsedData, i) => {
            const { pageContent, metadata: additionalMetadata } = parsedData;
            return new documents_1.Document({
                pageContent,
                metadata: parsed.length === 1
                    ? { ...metadata, ...additionalMetadata }
                    : {
                        ...metadata,
                        line: i + 1,
                        ...additionalMetadata
                    }
            });
        });
    }
    static async imports() {
        try {
            const { readFile } = await Promise.resolve().then(() => __importStar(require('node:fs/promises')));
            return { readFile };
        }
        catch (e) {
            console.error(e);
            throw new Error(`Failed to load fs/promises. Make sure you are running in Node.js environment.`);
        }
    }
}
class JSONLinesLoader extends TextLoader {
    constructor(filePathOrBlob, pointer, metadata) {
        super(filePathOrBlob);
        this.pointer = pointer;
        this.additionalMetadata = [];
        if (metadata) {
            this.metadata = typeof metadata === 'object' ? metadata : JSON.parse(metadata);
        }
    }
    async getAdditionalMetadata() {
        return this.additionalMetadata;
    }
    async parse(raw) {
        const lines = raw.split('\n');
        const jsons = lines
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => JSON.parse(line));
        const pointer = jsonpointer_1.default.compile(this.pointer);
        if (this.metadata) {
            const values = Object.values(this.metadata).filter((value) => typeof value === 'string' && value.startsWith('/'));
            let newJsons = [];
            for (const json of jsons) {
                let metadata = {};
                for (const value of values) {
                    if (value) {
                        const key = Object.keys(this.metadata).find((key) => this.metadata?.[key] === value);
                        if (key) {
                            metadata = {
                                ...metadata,
                                [key]: jsonpointer_1.default.get(json, value)
                            };
                        }
                    }
                }
                newJsons.push({ pageContent: pointer.get(json), metadata });
            }
            return newJsons;
        }
        return jsons.map((json) => {
            return { pageContent: pointer.get(json), metadata: {} };
        });
    }
}
module.exports = { nodeClass: Jsonlines_DocumentLoaders };
//# sourceMappingURL=Jsonlines.js.map