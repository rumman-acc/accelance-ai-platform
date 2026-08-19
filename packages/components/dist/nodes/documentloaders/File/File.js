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
const text_1 = require("@langchain/classic/document_loaders/fs/text");
const json_1 = require("@langchain/classic/document_loaders/fs/json");
const csv_1 = require("@langchain/community/document_loaders/fs/csv");
const pdf_1 = require("@langchain/community/document_loaders/fs/pdf");
const docx_1 = require("@langchain/community/document_loaders/fs/docx");
const base_1 = require("@langchain/classic/document_loaders/base");
const ExcelLoader_1 = require("../MicrosoftExcel/ExcelLoader");
const PowerpointLoader_1 = require("../MicrosoftPowerpoint/PowerpointLoader");
const storageUtils_1 = require("../../../src/storageUtils");
const utils_1 = require("../../../src/utils");
class File_DocumentLoaders {
    constructor() {
        this.label = 'File Loader';
        this.name = 'fileLoader';
        this.version = 2.0;
        this.type = 'Document';
        this.icon = 'file.svg';
        this.category = 'Document Loaders';
        this.description = `A generic file loader that can load different file types`;
        this.baseClasses = [this.type];
        this.inputs = [
            {
                label: 'File',
                name: 'file',
                type: 'file',
                fileType: '*'
            },
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Pdf Usage',
                name: 'usage',
                type: 'options',
                description: 'Only when loading PDF files',
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
                default: 'perPage',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Use Legacy Build',
                name: 'legacyBuild',
                type: 'boolean',
                description: 'Use legacy build for PDF compatibility issues',
                optional: true,
                additionalParams: true
            },
            {
                label: 'JSONL Pointer Extraction',
                name: 'pointerName',
                type: 'string',
                description: 'Only when loading JSONL files',
                placeholder: '<pointerName>',
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
        const fileBase64 = nodeData.inputs?.file;
        const metadata = nodeData.inputs?.metadata;
        const pdfUsage = nodeData.inputs?.pdfUsage || nodeData.inputs?.usage;
        const legacyBuild = nodeData.inputs?.legacyBuild;
        const pointerName = nodeData.inputs?.pointerName;
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys;
        const output = nodeData.outputs?.output;
        let omitMetadataKeys = [];
        if (_omitMetadataKeys) {
            omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim());
        }
        let files = [];
        const fileBlobs = [];
        const processRaw = options.processRaw;
        //FILE-STORAGE::["CONTRIBUTING.md","LICENSE.md","README.md"]
        const totalFiles = getOverrideFileInputs(nodeData, processRaw) || fileBase64;
        if (totalFiles.startsWith('FILE-STORAGE::')) {
            const fileName = totalFiles.replace('FILE-STORAGE::', '');
            if (fileName.startsWith('[') && fileName.endsWith(']')) {
                files = JSON.parse(fileName);
            }
            else {
                files = [fileName];
            }
            const orgId = options.orgId;
            const chatflowid = options.chatflowid;
            // specific to createAttachment to get files from chatId
            const retrieveAttachmentChatId = options.retrieveAttachmentChatId;
            if (retrieveAttachmentChatId) {
                for (const file of files) {
                    if (!file)
                        continue;
                    const fileData = await (0, storageUtils_1.getFileFromStorage)(file, orgId, chatflowid, options.chatId);
                    const blob = new Blob([new Uint8Array(fileData)]);
                    fileBlobs.push({ blob, ext: file.split('.').pop() || '' });
                }
            }
            else {
                for (const file of files) {
                    if (!file)
                        continue;
                    const fileData = await (0, storageUtils_1.getFileFromStorage)(file, orgId, chatflowid);
                    const blob = new Blob([new Uint8Array(fileData)]);
                    fileBlobs.push({ blob, ext: file.split('.').pop() || '' });
                }
            }
        }
        else {
            if (totalFiles.startsWith('[') && totalFiles.endsWith(']')) {
                files = JSON.parse(totalFiles);
            }
            else {
                files = [totalFiles];
            }
            for (const file of files) {
                if (!file)
                    continue;
                const splitDataURI = file.split(',');
                splitDataURI.pop();
                const bf = Buffer.from(splitDataURI.pop() || '', 'base64');
                const blob = new Blob([bf]);
                let extension = '';
                // eslint-disable-next-line no-useless-escape
                const match = file.match(/^data:([A-Za-z-+\/]+);base64,/);
                if (!match) {
                    // Fallback: check if there's a filename pattern at the end
                    const filenameMatch = file.match(/,filename:(.+\.\w+)$/);
                    if (filenameMatch && filenameMatch[1]) {
                        const filename = filenameMatch[1];
                        const fileExt = filename.split('.').pop() || '';
                        fileBlobs.push({
                            blob,
                            ext: fileExt
                        });
                    }
                    else {
                        fileBlobs.push({
                            blob,
                            ext: extension
                        });
                    }
                }
                else {
                    const mimeType = match[1];
                    fileBlobs.push({
                        blob,
                        ext: (0, utils_1.mapMimeTypeToExt)(mimeType)
                    });
                }
            }
        }
        const loader = new MultiFileLoader(fileBlobs, {
            json: (blob) => new json_1.JSONLoader(blob),
            jsonl: (blob) => new json_1.JSONLinesLoader(blob, '/' + pointerName.trim()),
            txt: (blob) => new text_1.TextLoader(blob),
            html: (blob) => new text_1.TextLoader(blob),
            css: (blob) => new text_1.TextLoader(blob),
            js: (blob) => new text_1.TextLoader(blob),
            xml: (blob) => new text_1.TextLoader(blob),
            md: (blob) => new text_1.TextLoader(blob),
            csv: (blob) => new csv_1.CSVLoader(blob),
            xls: (blob) => new ExcelLoader_1.LoadOfSheet(blob),
            xlsx: (blob) => new ExcelLoader_1.LoadOfSheet(blob),
            xlsm: (blob) => new ExcelLoader_1.LoadOfSheet(blob),
            xlsb: (blob) => new ExcelLoader_1.LoadOfSheet(blob),
            docx: (blob) => new docx_1.DocxLoader(blob),
            doc: (blob) => new docx_1.DocxLoader(blob),
            ppt: (blob) => new PowerpointLoader_1.PowerpointLoader(blob),
            pptx: (blob) => new PowerpointLoader_1.PowerpointLoader(blob),
            pdf: (blob) => pdfUsage === 'perFile'
                ? // @ts-ignore
                    new pdf_1.PDFLoader(blob, {
                        splitPages: false,
                        pdfjs: () => 
                        // @ts-ignore
                        legacyBuild ? Promise.resolve().then(() => __importStar(require('pdfjs-dist/legacy/build/pdf.js'))) : Promise.resolve().then(() => __importStar(require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js')))
                    })
                : // @ts-ignore
                    new pdf_1.PDFLoader(blob, {
                        pdfjs: () => 
                        // @ts-ignore
                        legacyBuild ? Promise.resolve().then(() => __importStar(require('pdfjs-dist/legacy/build/pdf.js'))) : Promise.resolve().then(() => __importStar(require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js')))
                    }),
            '': (blob) => new text_1.TextLoader(blob)
        });
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
const getOverrideFileInputs = (nodeData, processRaw) => {
    const txtFileBase64 = nodeData.inputs?.txtFile;
    const pdfFileBase64 = nodeData.inputs?.pdfFile;
    const jsonFileBase64 = nodeData.inputs?.jsonFile;
    const csvFileBase64 = nodeData.inputs?.csvFile;
    const jsonlinesFileBase64 = nodeData.inputs?.jsonlinesFile;
    const docxFileBase64 = nodeData.inputs?.docxFile;
    const yamlFileBase64 = nodeData.inputs?.yamlFile;
    const excelFileBase64 = nodeData.inputs?.excelFile;
    const powerpointFileBase64 = nodeData.inputs?.powerpointFile;
    const removePrefix = (storageFile) => {
        const fileName = storageFile.replace('FILE-STORAGE::', '');
        if (fileName.startsWith('[') && fileName.endsWith(']')) {
            return JSON.parse(fileName);
        }
        return [fileName];
    };
    // If exists, combine all file inputs into an array
    const files = [];
    if (txtFileBase64) {
        files.push(...removePrefix(txtFileBase64));
    }
    if (pdfFileBase64) {
        files.push(...removePrefix(pdfFileBase64));
    }
    if (jsonFileBase64) {
        files.push(...removePrefix(jsonFileBase64));
    }
    if (csvFileBase64) {
        files.push(...removePrefix(csvFileBase64));
    }
    if (jsonlinesFileBase64) {
        files.push(...removePrefix(jsonlinesFileBase64));
    }
    if (docxFileBase64) {
        files.push(...removePrefix(docxFileBase64));
    }
    if (yamlFileBase64) {
        files.push(...removePrefix(yamlFileBase64));
    }
    if (excelFileBase64) {
        files.push(...removePrefix(excelFileBase64));
    }
    if (powerpointFileBase64) {
        files.push(...removePrefix(powerpointFileBase64));
    }
    if (processRaw) {
        return files.length ? JSON.stringify(files) : '';
    }
    return files.length ? `FILE-STORAGE::${JSON.stringify(files)}` : '';
};
class MultiFileLoader extends base_1.BaseDocumentLoader {
    constructor(fileBlobs, loaders) {
        super();
        this.fileBlobs = fileBlobs;
        this.loaders = loaders;
        if (Object.keys(loaders).length === 0) {
            throw new Error('Must provide at least one loader');
        }
    }
    async load() {
        const documents = [];
        for (const fileBlob of this.fileBlobs) {
            const loaderFactory = this.loaders[fileBlob.ext];
            if (loaderFactory) {
                const loader = loaderFactory(fileBlob.blob);
                documents.push(...(await loader.load()));
            }
            else {
                const loader = new text_1.TextLoader(fileBlob.blob);
                try {
                    documents.push(...(await loader.load()));
                }
                catch (error) {
                    throw new Error(`Error loading file`);
                }
            }
        }
        return documents;
    }
}
module.exports = { nodeClass: File_DocumentLoaders };
//# sourceMappingURL=File.js.map