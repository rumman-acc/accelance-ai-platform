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
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const pdf_1 = require("@langchain/community/document_loaders/fs/pdf");
const src_1 = require("../../../src");
class Pdf_DocumentLoaders {
    constructor() {
        this.label = 'Pdf File';
        this.name = 'pdfFile';
        this.version = 2.0;
        this.type = 'Document';
        this.icon = 'pdf.svg';
        this.category = 'Document Loaders';
        this.description = `Load data from PDF files`;
        this.baseClasses = [this.type];
        this.inputs = [
            {
                label: 'Pdf File',
                name: 'pdfFile',
                type: 'file',
                fileType: '.pdf'
            },
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Usage',
                name: 'usage',
                type: 'options',
                options: [
                    {
                        label: 'One document per page',
                        name: 'perPage'
                    },
                    {
                        label: 'One document per file',
                        name: 'perFile'
                    }
                ],
                default: 'perPage'
            },
            {
                label: 'Use Legacy Build',
                name: 'legacyBuild',
                type: 'boolean',
                optional: true,
                additionalParams: true
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
        const pdfFileBase64 = nodeData.inputs?.pdfFile;
        const usage = nodeData.inputs?.usage;
        const metadata = nodeData.inputs?.metadata;
        const legacyBuild = nodeData.inputs?.legacyBuild;
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys;
        const output = nodeData.outputs?.output;
        let omitMetadataKeys = [];
        if (_omitMetadataKeys) {
            omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim());
        }
        let docs = [];
        let files = [];
        //FILE-STORAGE::["CONTRIBUTING.md","LICENSE.md","README.md"]
        if (pdfFileBase64.startsWith('FILE-STORAGE::')) {
            const fileName = pdfFileBase64.replace('FILE-STORAGE::', '');
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
                const bf = Buffer.from(fileData);
                await this.extractDocs(usage, bf, legacyBuild, textSplitter, docs);
            }
        }
        else {
            if (pdfFileBase64.startsWith('[') && pdfFileBase64.endsWith(']')) {
                files = JSON.parse(pdfFileBase64);
            }
            else {
                files = [pdfFileBase64];
            }
            for (const file of files) {
                if (!file)
                    continue;
                const splitDataURI = file.split(',');
                splitDataURI.pop();
                const bf = Buffer.from(splitDataURI.pop() || '', 'base64');
                await this.extractDocs(usage, bf, legacyBuild, textSplitter, docs);
            }
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
    async extractDocs(usage, bf, legacyBuild, textSplitter, docs) {
        if (usage === 'perFile') {
            const loader = new pdf_1.PDFLoader(new Blob([new Uint8Array(bf)]), {
                splitPages: false,
                pdfjs: () => 
                // @ts-ignore
                legacyBuild ? Promise.resolve().then(() => __importStar(require('pdfjs-dist/legacy/build/pdf.js'))) : Promise.resolve().then(() => __importStar(require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js')))
            });
            if (textSplitter) {
                let splittedDocs = await loader.load();
                splittedDocs = await textSplitter.splitDocuments(splittedDocs);
                docs.push(...splittedDocs);
            }
            else {
                docs.push(...(await loader.load()));
            }
        }
        else {
            const loader = new pdf_1.PDFLoader(new Blob([new Uint8Array(bf)]), {
                pdfjs: () => 
                // @ts-ignore
                legacyBuild ? Promise.resolve().then(() => __importStar(require('pdfjs-dist/legacy/build/pdf.js'))) : Promise.resolve().then(() => __importStar(require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js')))
            });
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
}
module.exports = { nodeClass: Pdf_DocumentLoaders };
//# sourceMappingURL=Pdf.js.map