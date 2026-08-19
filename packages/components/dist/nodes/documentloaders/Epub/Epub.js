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
const src_1 = require("../../../src");
const epub_1 = require("@langchain/community/document_loaders/fs/epub");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class Epub_DocumentLoaders {
    constructor() {
        this.label = 'Epub File';
        this.name = 'epubFile';
        this.version = 1.0;
        this.type = 'Document';
        this.icon = 'epub.svg';
        this.category = 'Document Loaders';
        this.description = 'Load data from EPUB files';
        this.baseClasses = [this.type];
        this.inputs = [
            {
                label: 'Epub File',
                name: 'epubFile',
                type: 'file',
                fileType: '.epub'
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
                        label: 'One document per chapter',
                        name: 'perChapter'
                    },
                    {
                        label: 'One document per file',
                        name: 'perFile'
                    }
                ],
                default: 'perChapter'
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
                description: 'Metadata keys to omit, comma-separated',
                placeholder: 'key1, key2, key3',
                optional: true,
                additionalParams: true
            }
        ];
        this.outputs = [
            {
                label: 'Document',
                name: 'document',
                description: 'Array of document objects',
                baseClasses: [...this.baseClasses, 'json']
            },
            {
                label: 'Text',
                name: 'text',
                description: 'Concatenated text from documents',
                baseClasses: ['string', 'json']
            }
        ];
    }
    async init(nodeData, _, options) {
        const textSplitter = nodeData.inputs?.textSplitter;
        const epubFileBase64 = nodeData.inputs?.epubFile;
        const usage = nodeData.inputs?.usage;
        const metadata = nodeData.inputs?.metadata;
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys;
        const output = nodeData.outputs?.output;
        let omitMetadataKeys = [];
        if (_omitMetadataKeys) {
            omitMetadataKeys = _omitMetadataKeys.split(',').map((key) => key.trim());
        }
        let docs = [];
        let files = [];
        const tempDir = path.join(process.cwd(), 'temp_epub_files');
        fs.mkdirSync(tempDir, { recursive: true });
        try {
            if (epubFileBase64.startsWith('FILE-STORAGE::')) {
                const fileName = epubFileBase64.replace('FILE-STORAGE::', '');
                files = fileName.startsWith('[') && fileName.endsWith(']') ? JSON.parse(fileName) : [fileName];
                const chatflowid = options.chatflowid;
                const orgId = options.orgId;
                for (const file of files) {
                    if (!file)
                        continue;
                    const fileData = await (0, src_1.getFileFromStorage)(file, orgId, chatflowid);
                    const tempFilePath = path.join(tempDir, `${Date.now()}_${file}`);
                    fs.writeFileSync(tempFilePath, fileData);
                    await this.extractDocs(usage, tempFilePath, textSplitter, docs);
                }
            }
            else {
                files = epubFileBase64.startsWith('[') && epubFileBase64.endsWith(']') ? JSON.parse(epubFileBase64) : [epubFileBase64];
                for (const file of files) {
                    if (!file)
                        continue;
                    const splitDataURI = file.split(',');
                    splitDataURI.pop();
                    const fileBuffer = Buffer.from(splitDataURI.pop() || '', 'base64');
                    const tempFilePath = path.join(tempDir, `${Date.now()}_epub_file.epub`);
                    fs.writeFileSync(tempFilePath, fileBuffer);
                    await this.extractDocs(usage, tempFilePath, textSplitter, docs);
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
        catch (error) {
            console.error('Error processing EPUB files:', error);
            throw error;
        }
        finally {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
    async extractDocs(usage, filePath, textSplitter, docs) {
        const loader = new epub_1.EPubLoader(filePath, { splitChapters: usage === 'perChapter' });
        const loadedDocs = await loader.load();
        const processedDocs = textSplitter ? await textSplitter.splitDocuments(loadedDocs) : loadedDocs;
        docs.push(...processedDocs);
    }
}
module.exports = { nodeClass: Epub_DocumentLoaders };
//# sourceMappingURL=Epub.js.map