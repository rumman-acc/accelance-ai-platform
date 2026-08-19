"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExcelLoader_1 = require("./ExcelLoader");
const src_1 = require("../../../src");
class MicrosoftExcel_DocumentLoaders {
    constructor() {
        this.label = 'Microsoft Excel';
        this.name = 'microsoftExcel';
        this.version = 1.0;
        this.type = 'Document';
        this.icon = 'excel.svg';
        this.category = 'Document Loaders';
        this.description = `Load data from Microsoft Excel files`;
        this.baseClasses = [this.type];
        this.inputs = [
            {
                label: 'Excel File',
                name: 'excelFile',
                type: 'file',
                fileType: '.xlsx, .xls, .xlsm, .xlsb'
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
    getFiles(nodeData) {
        const excelFileBase64 = nodeData.inputs?.excelFile;
        let files = [];
        let fromStorage = true;
        if (excelFileBase64.startsWith('FILE-STORAGE::')) {
            const fileName = excelFileBase64.replace('FILE-STORAGE::', '');
            if (fileName.startsWith('[') && fileName.endsWith(']')) {
                files = JSON.parse(fileName);
            }
            else {
                files = [fileName];
            }
        }
        else {
            if (excelFileBase64.startsWith('[') && excelFileBase64.endsWith(']')) {
                files = JSON.parse(excelFileBase64);
            }
            else {
                files = [excelFileBase64];
            }
            fromStorage = false;
        }
        return { files, fromStorage };
    }
    async getFileData(file, { orgId, chatflowid }, fromStorage) {
        if (fromStorage) {
            return (0, src_1.getFileFromStorage)(file, orgId, chatflowid);
        }
        else {
            const splitDataURI = file.split(',');
            splitDataURI.pop();
            return Buffer.from(splitDataURI.pop() || '', 'base64');
        }
    }
    async init(nodeData, _, options) {
        const textSplitter = nodeData.inputs?.textSplitter;
        const metadata = nodeData.inputs?.metadata;
        const output = nodeData.outputs?.output;
        const _omitMetadataKeys = nodeData.inputs?.omitMetadataKeys;
        let docs = [];
        const orgId = options.orgId;
        const chatflowid = options.chatflowid;
        const { files, fromStorage } = this.getFiles(nodeData);
        for (const file of files) {
            if (!file)
                continue;
            const fileData = await this.getFileData(file, { orgId, chatflowid }, fromStorage);
            const blob = new Blob([new Uint8Array(fileData)]);
            const loader = new ExcelLoader_1.LoadOfSheet(blob);
            // use spread instead of push, because it raises RangeError: Maximum call stack size exceeded when too many docs
            docs = [...docs, ...(await (0, src_1.handleDocumentLoaderDocuments)(loader, textSplitter))];
        }
        docs = (0, src_1.handleDocumentLoaderMetadata)(docs, _omitMetadataKeys, metadata);
        return (0, src_1.handleDocumentLoaderOutput)(docs, output);
    }
}
module.exports = { nodeClass: MicrosoftExcel_DocumentLoaders };
//# sourceMappingURL=MicrosoftExcel.js.map