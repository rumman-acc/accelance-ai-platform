"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentStoreDTO = exports.addLoaderSource = exports.DocumentStoreStatus = void 0;
const DocumentStore_1 = require("./database/entities/DocumentStore");
var DocumentStoreStatus;
(function (DocumentStoreStatus) {
    DocumentStoreStatus["EMPTY_SYNC"] = "EMPTY";
    DocumentStoreStatus["SYNC"] = "SYNC";
    DocumentStoreStatus["SYNCING"] = "SYNCING";
    DocumentStoreStatus["STALE"] = "STALE";
    DocumentStoreStatus["NEW"] = "NEW";
    DocumentStoreStatus["UPSERTING"] = "UPSERTING";
    DocumentStoreStatus["UPSERTED"] = "UPSERTED";
})(DocumentStoreStatus || (exports.DocumentStoreStatus = DocumentStoreStatus = {}));
const getFileName = (fileBase64) => {
    let fileNames = [];
    if (fileBase64.startsWith('FILE-STORAGE::')) {
        const names = fileBase64.substring(14);
        if (names.includes('[') && names.includes(']')) {
            const files = JSON.parse(names);
            return files.join(', ');
        }
        else {
            return fileBase64.substring(14);
        }
    }
    if (fileBase64.startsWith('[') && fileBase64.endsWith(']')) {
        const files = JSON.parse(fileBase64);
        for (const file of files) {
            const splitDataURI = file.split(',');
            const filename = splitDataURI[splitDataURI.length - 1].split(':')[1];
            fileNames.push(filename);
        }
        return fileNames.join(', ');
    }
    else {
        const splitDataURI = fileBase64.split(',');
        const filename = splitDataURI[splitDataURI.length - 1].split(':')[1];
        return filename;
    }
};
const addLoaderSource = (loader, isGetFileNameOnly = false) => {
    let source = 'None';
    const handleUnstructuredFileLoader = (config, isGetFileNameOnly) => {
        if (config.fileObject) {
            return isGetFileNameOnly ? getFileName(config.fileObject) : config.fileObject.replace('FILE-STORAGE::', '');
        }
        return config.filePath || 'None';
    };
    switch (loader.loaderId) {
        case 'pdfFile':
        case 'docxFile':
        case 'jsonFile':
        case 'csvFile':
        case 'file':
        case 'jsonlinesFile':
        case 'txtFile':
            source = isGetFileNameOnly
                ? getFileName(loader.loaderConfig?.[loader.loaderId])
                : loader.loaderConfig?.[loader.loaderId]?.replace('FILE-STORAGE::', '') || 'None';
            break;
        case 'apiLoader':
            source = loader.loaderConfig?.url + ' (' + loader.loaderConfig?.method + ')';
            break;
        case 'cheerioWebScraper':
        case 'playwrightWebScraper':
        case 'puppeteerWebScraper':
            source = loader.loaderConfig?.url || 'None';
            break;
        case 'unstructuredFileLoader':
            source = handleUnstructuredFileLoader(loader.loaderConfig || {}, isGetFileNameOnly);
            break;
        default:
            source = 'None';
            break;
    }
    return source;
};
exports.addLoaderSource = addLoaderSource;
class DocumentStoreDTO {
    constructor() { }
    static fromEntity(entity) {
        let documentStoreDTO = new DocumentStoreDTO();
        Object.assign(documentStoreDTO, entity);
        documentStoreDTO.id = entity.id;
        documentStoreDTO.name = entity.name;
        documentStoreDTO.description = entity.description;
        documentStoreDTO.status = entity.status;
        documentStoreDTO.workspaceId = entity.workspaceId;
        documentStoreDTO.totalChars = 0;
        documentStoreDTO.totalChunks = 0;
        if (entity.whereUsed) {
            documentStoreDTO.whereUsed = JSON.parse(entity.whereUsed);
        }
        else {
            documentStoreDTO.whereUsed = [];
        }
        if (entity.vectorStoreConfig) {
            documentStoreDTO.vectorStoreConfig = JSON.parse(entity.vectorStoreConfig);
        }
        if (entity.embeddingConfig) {
            documentStoreDTO.embeddingConfig = JSON.parse(entity.embeddingConfig);
        }
        if (entity.recordManagerConfig) {
            documentStoreDTO.recordManagerConfig = JSON.parse(entity.recordManagerConfig);
        }
        if (entity.loaders) {
            documentStoreDTO.loaders = JSON.parse(entity.loaders);
            documentStoreDTO.loaders.map((loader) => {
                documentStoreDTO.totalChars += loader.totalChars || 0;
                documentStoreDTO.totalChunks += loader.totalChunks || 0;
                loader.source = (0, exports.addLoaderSource)(loader);
                if (loader.status !== 'SYNC') {
                    documentStoreDTO.status = DocumentStoreStatus.STALE;
                }
            });
        }
        return documentStoreDTO;
    }
    static fromEntities(entities) {
        if (entities.length === 0) {
            return [];
        }
        return entities.map((entity) => this.fromEntity(entity));
    }
    static toEntity(body) {
        const docStore = new DocumentStore_1.DocumentStore();
        // Explicit allowlist — never accept id or timestamps from client
        docStore.name = body.name;
        docStore.description = body.description ?? null;
        docStore.loaders = body.loaders ?? '[]';
        docStore.whereUsed = body.whereUsed ?? '[]';
        docStore.vectorStoreConfig = body.vectorStoreConfig ?? null;
        docStore.embeddingConfig = body.embeddingConfig ?? null;
        docStore.recordManagerConfig = body.recordManagerConfig ?? null;
        // when a new document store is created, it is empty and in sync
        docStore.status = DocumentStoreStatus.EMPTY_SYNC;
        return docStore;
    }
}
exports.DocumentStoreDTO = DocumentStoreDTO;
//# sourceMappingURL=Interface.DocumentStore.js.map