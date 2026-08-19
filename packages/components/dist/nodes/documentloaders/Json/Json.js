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
const src_1 = require("../../../src");
const documents_1 = require("@langchain/core/documents");
const jsonpointer_1 = __importDefault(require("jsonpointer"));
const base_1 = require("@langchain/classic/document_loaders/base");
const howToUseCode = `
You can add metadata dynamically from the document:

For example, if the JSON document is:
\`\`\`json
[
    {
        "url": "https://www.google.com",
        "body": "This is body 1"
    },
    {
        "url": "https://www.yahoo.com",
        "body": "This is body 2"
    }
]

\`\`\`

You can have the "url" value as metadata by returning the following:
\`\`\`json
{
    "url": "/url"
}
\`\`\``;
class Json_DocumentLoaders {
    constructor() {
        this.label = 'Json File';
        this.name = 'jsonFile';
        this.version = 3.1;
        this.type = 'Document';
        this.icon = 'json.svg';
        this.category = 'Document Loaders';
        this.description = `Load data from JSON files`;
        this.baseClasses = [this.type];
        this.inputs = [
            {
                label: 'Json File',
                name: 'jsonFile',
                type: 'file',
                fileType: '.json'
            },
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Separate by JSON Object (JSON Array)',
                name: 'separateByObject',
                type: 'boolean',
                description: 'If enabled and the file is a JSON Array, each JSON object will be extracted as a chunk',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Pointers Extraction (separated by commas)',
                name: 'pointersName',
                type: 'string',
                description: 'Ex: { "key": "value" }, Pointer Extraction = "key", "value" will be extracted as pageContent of the chunk. Use comma to separate multiple pointers',
                placeholder: 'key1, key2',
                optional: true,
                hide: {
                    separateByObject: true
                }
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
        const jsonFileBase64 = nodeData.inputs?.jsonFile;
        const pointersName = nodeData.inputs?.pointersName;
        const metadata = nodeData.inputs?.metadata;
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys;
        const separateByObject = nodeData.inputs?.separateByObject;
        const output = nodeData.outputs?.output;
        let omitMetadataKeys = [];
        if (_omitMetadataKeys) {
            omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim());
        }
        let pointers = [];
        if (pointersName) {
            const outputString = pointersName.replace(/[^a-zA-Z0-9,]+/g, ',');
            pointers = outputString.split(',').map((pointer) => '/' + pointer.trim());
        }
        let docs = [];
        let files = [];
        //FILE-STORAGE::["CONTRIBUTING.md","LICENSE.md","README.md"]
        if (jsonFileBase64.startsWith('FILE-STORAGE::')) {
            const fileName = jsonFileBase64.replace('FILE-STORAGE::', '');
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
                const loader = new JSONLoader(blob, pointers.length != 0 ? pointers : undefined, metadata, separateByObject);
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
            if (jsonFileBase64.startsWith('[') && jsonFileBase64.endsWith(']')) {
                files = JSON.parse(jsonFileBase64);
            }
            else {
                files = [jsonFileBase64];
            }
            for (const file of files) {
                if (!file)
                    continue;
                const splitDataURI = file.split(',');
                splitDataURI.pop();
                const bf = Buffer.from(splitDataURI.pop() || '', 'base64');
                const blob = new Blob([bf]);
                const loader = new JSONLoader(blob, pointers.length != 0 ? pointers : undefined, metadata, separateByObject);
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
class JSONLoader extends TextLoader {
    constructor(filePathOrBlob, pointers = [], metadataMapping = {}, separateByObject = false) {
        super(filePathOrBlob);
        this.pointers = Array.isArray(pointers) ? pointers : [pointers];
        if (metadataMapping) {
            this.metadataMapping = typeof metadataMapping === 'object' ? metadataMapping : JSON.parse(metadataMapping);
        }
        this.separateByObject = separateByObject;
    }
    async parse(raw) {
        const json = JSON.parse(raw.trim());
        const documents = [];
        // Handle both single object and array of objects
        const jsonArray = Array.isArray(json) ? json : [json];
        for (const item of jsonArray) {
            if (this.separateByObject) {
                if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                    const metadata = this.extractMetadata(item);
                    const pageContent = this.formatObjectAsKeyValue(item);
                    documents.push({
                        pageContent,
                        metadata
                    });
                }
            }
            else {
                const content = this.extractContent(item);
                const metadata = this.extractMetadata(item);
                for (const pageContent of content) {
                    documents.push({
                        pageContent,
                        metadata
                    });
                }
            }
        }
        return documents;
    }
    /**
     * Extracts content based on specified pointers or all strings if no pointers
     */
    extractContent(json) {
        const compiledPointers = this.pointers.map((pointer) => jsonpointer_1.default.compile(pointer));
        return this.extractArrayStringsFromObject(json, compiledPointers, !(this.pointers.length > 0));
    }
    /**
     * Extracts metadata based on the mapping configuration
     */
    extractMetadata(json) {
        let metadata = {};
        if (this.metadataMapping) {
            const values = Object.values(this.metadataMapping).filter((value) => typeof value === 'string' && value.startsWith('/'));
            for (const value of values) {
                if (value) {
                    const key = Object.keys(this.metadataMapping).find((key) => this.metadataMapping?.[key] === value);
                    if (key) {
                        metadata = {
                            ...metadata,
                            [key]: jsonpointer_1.default.get(json, value)
                        };
                    }
                }
            }
        }
        return metadata;
    }
    /**
     * Formats a JSON object as readable key-value pairs
     */
    formatObjectAsKeyValue(obj, prefix = '') {
        const lines = [];
        for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (value === null || value === undefined) {
                lines.push(`${fullKey}: ${value}`);
            }
            else if (Array.isArray(value)) {
                lines.push(`${fullKey}: ${JSON.stringify(value)}`);
            }
            else if (typeof value === 'object') {
                // Recursively format nested objects
                lines.push(this.formatObjectAsKeyValue(value, fullKey));
            }
            else {
                lines.push(`${fullKey}: ${value}`);
            }
        }
        return lines.join('\n');
    }
    /**
     * If JSON pointers are specified, return all strings below any of them
     * and exclude all other nodes expect if they match a JSON pointer.
     * If no JSON pointer is specified then return all string in the object.
     */
    extractArrayStringsFromObject(json, pointers, extractAllStrings = false, keyHasBeenFound = false) {
        if (!json) {
            return [];
        }
        if (typeof json === 'string' && extractAllStrings) {
            return [json];
        }
        if (Array.isArray(json) && extractAllStrings) {
            let extractedString = [];
            for (const element of json) {
                extractedString = extractedString.concat(this.extractArrayStringsFromObject(element, pointers, true));
            }
            return extractedString;
        }
        if (typeof json === 'object') {
            if (extractAllStrings) {
                return this.extractArrayStringsFromObject(Object.values(json), pointers, true);
            }
            const targetedEntries = this.getTargetedEntries(json, pointers);
            const thisLevelEntries = Object.values(json);
            const notTargetedEntries = thisLevelEntries.filter((entry) => !targetedEntries.includes(entry));
            let extractedStrings = [];
            if (targetedEntries.length > 0) {
                for (const oneEntry of targetedEntries) {
                    extractedStrings = extractedStrings.concat(this.extractArrayStringsFromObject(oneEntry, pointers, true, true));
                }
                for (const oneEntry of notTargetedEntries) {
                    extractedStrings = extractedStrings.concat(this.extractArrayStringsFromObject(oneEntry, pointers, false, true));
                }
            }
            else if (extractAllStrings || !keyHasBeenFound) {
                for (const oneEntry of notTargetedEntries) {
                    extractedStrings = extractedStrings.concat(this.extractArrayStringsFromObject(oneEntry, pointers, extractAllStrings));
                }
            }
            return extractedStrings;
        }
        return [];
    }
    getTargetedEntries(json, pointers) {
        const targetEntries = [];
        for (const pointer of pointers) {
            const targetedEntry = pointer.get(json);
            if (targetedEntry) {
                targetEntries.push(targetedEntry);
            }
        }
        return targetEntries;
    }
}
module.exports = { nodeClass: Json_DocumentLoaders };
//# sourceMappingURL=Json.js.map