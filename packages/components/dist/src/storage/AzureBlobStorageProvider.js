"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureBlobStorageProvider = void 0;
const storage_blob_1 = require("@azure/storage-blob");
const multer_1 = __importDefault(require("multer"));
const multer_azure_blob_storage_1 = require("multer-azure-blob-storage");
const uuid_1 = require("uuid");
const winston_azure_blob_1 = require("winston-azure-blob");
const BaseStorageProvider_1 = require("./BaseStorageProvider");
/**
 * Extends MulterAzureStorage to set file.path from file.blobName after upload.
 * The server expects file.path (local/GCS) or file.key (S3) but multer-azure-blob-storage
 * only sets file.blobName. This subclass bridges that gap.
 */
class MulterAzureStorageWithPath extends multer_azure_blob_storage_1.MulterAzureStorage {
    _handleFile(req, file, cb) {
        return super._handleFile(req, file, (err, info) => {
            if (!err && info) {
                info.path = info.blobName;
            }
            cb(err, info);
        });
    }
}
class AzureBlobStorageProvider extends BaseStorageProvider_1.BaseStorageProvider {
    constructor() {
        super();
        const config = this.initAzureConfig();
        this.containerClient = config.containerClient;
        this.containerName = config.containerName;
    }
    initAzureConfig() {
        const connectionString = process.env.AZURE_BLOB_STORAGE_CONNECTION_STRING;
        const accountName = process.env.AZURE_BLOB_STORAGE_ACCOUNT_NAME;
        const accountKey = process.env.AZURE_BLOB_STORAGE_ACCOUNT_KEY;
        const containerName = process.env.AZURE_BLOB_STORAGE_CONTAINER_NAME;
        if (!containerName || containerName.trim() === '') {
            throw new Error('AZURE_BLOB_STORAGE_CONTAINER_NAME env variable is required');
        }
        let blobServiceClient;
        // Authenticate either using connection string or account name and key
        if (connectionString && connectionString.trim() !== '') {
            blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(connectionString);
        }
        else if (accountName && accountName.trim() !== '' && accountKey && accountKey.trim() !== '') {
            const sharedKeyCredential = new storage_blob_1.StorageSharedKeyCredential(accountName, accountKey);
            blobServiceClient = new storage_blob_1.BlobServiceClient(`https://${accountName}.blob.core.windows.net`, sharedKeyCredential);
        }
        else {
            throw new Error('Azure Blob Storage configuration is missing. Provide AZURE_BLOB_STORAGE_CONNECTION_STRING or AZURE_BLOB_STORAGE_ACCOUNT_NAME + AZURE_BLOB_STORAGE_ACCOUNT_KEY');
        }
        const containerClient = blobServiceClient.getContainerClient(containerName);
        return { containerClient, containerName };
    }
    getStorageType() {
        return 'azure';
    }
    getConfig() {
        return {
            containerName: this.containerName
        };
    }
    async addBase64FilesToStorage(fileBase64, chatflowid, fileNames, orgId) {
        // Validate chatflowid
        this.validateChatflowId(chatflowid);
        this.validatePathSecurity(chatflowid);
        const splitDataURI = fileBase64.split(',');
        const filename = splitDataURI.pop()?.split(':')[1] ?? '';
        const bf = Buffer.from(splitDataURI.pop() || '', 'base64');
        const mime = splitDataURI[0].split(':')[1].split(';')[0];
        const sanitizedFilename = this.sanitizeFilename(filename);
        const blobName = `${orgId}/${chatflowid}/${sanitizedFilename}`;
        const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.upload(bf, bf.length, {
            blobHTTPHeaders: { blobContentType: mime }
        });
        fileNames.push(sanitizedFilename);
        const totalSize = await this.getStorageSize(orgId);
        return { path: 'FILE-STORAGE::' + JSON.stringify(fileNames), totalSize: totalSize / 1024 / 1024 };
    }
    async addArrayFilesToStorage(mime, bf, fileName, fileNames, ...paths) {
        const sanitizedFilename = this.sanitizeFilename(fileName);
        let blobName = paths.reduce((acc, cur) => acc + '/' + cur, '') + '/' + sanitizedFilename;
        if (blobName.startsWith('/')) {
            blobName = blobName.substring(1);
        }
        const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.upload(bf, bf.length, {
            blobHTTPHeaders: { blobContentType: mime }
        });
        fileNames.push(sanitizedFilename);
        const totalSize = await this.getStorageSize(paths[0]);
        return { path: 'FILE-STORAGE::' + JSON.stringify(fileNames), totalSize: totalSize / 1024 / 1024 };
    }
    async addSingleFileToStorage(mime, bf, fileName, ...paths) {
        const sanitizedFilename = this.sanitizeFilename(fileName);
        let blobName = paths.reduce((acc, cur) => acc + '/' + cur, '') + '/' + sanitizedFilename;
        if (blobName.startsWith('/')) {
            blobName = blobName.substring(1);
        }
        const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.upload(bf, bf.length, {
            blobHTTPHeaders: { blobContentType: mime }
        });
        const totalSize = await this.getStorageSize(paths[0]);
        return { path: 'FILE-STORAGE::' + sanitizedFilename, totalSize: totalSize / 1024 / 1024 };
    }
    async getFileFromUpload(filePath) {
        let blobName = filePath;
        // remove the first '/' if it exists
        if (blobName.startsWith('/')) {
            blobName = blobName.substring(1);
        }
        const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
        const downloadResponse = await blockBlobClient.downloadToBuffer();
        return downloadResponse;
    }
    async getFileFromStorage(file, ...paths) {
        const sanitizedFilename = this.sanitizeFilename(file);
        let blobName = paths.reduce((acc, cur) => acc + '/' + cur, '') + '/' + sanitizedFilename;
        if (blobName.startsWith('/')) {
            blobName = blobName.substring(1);
        }
        const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
        const buffer = await blockBlobClient.downloadToBuffer();
        return buffer;
    }
    async streamStorageFile(chatflowId, chatId, fileName, orgId) {
        // Validate chatflowId and chatId
        this.validateChatflowId(chatflowId);
        this.validatePathSecurity(chatflowId, chatId);
        const sanitizedFilename = this.sanitizeFilename(fileName);
        const blobName = `${orgId}/${chatflowId}/${chatId}/${sanitizedFilename}`;
        const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
        const buffer = await blockBlobClient.downloadToBuffer();
        return buffer;
    }
    async getFilesListFromStorage(...paths) {
        let prefix = paths.reduce((acc, cur) => acc + '/' + cur, '');
        if (prefix.startsWith('/')) {
            prefix = prefix.substring(1);
        }
        const filesList = [];
        for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
            filesList.push({
                name: blob.name.split('/').pop() || '',
                path: blob.name,
                size: blob.properties.contentLength || 0
            });
        }
        return filesList;
    }
    async removeFilesFromStorage(...paths) {
        let prefix = paths.reduce((acc, cur) => acc + '/' + cur, '');
        if (prefix.startsWith('/')) {
            prefix = prefix.substring(1);
        }
        // Delete all blobs with the prefix
        for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
            await this.containerClient.deleteBlob(blob.name);
        }
        const totalSize = await this.getStorageSize(paths[0]);
        return { totalSize: totalSize / 1024 / 1024 };
    }
    async removeSpecificFileFromUpload(filePath) {
        let blobName = filePath;
        if (blobName.startsWith('/')) {
            blobName = blobName.substring(1);
        }
        await this.containerClient.deleteBlob(blobName);
    }
    async removeSpecificFileFromStorage(...paths) {
        let blobName = paths.reduce((acc, cur) => acc + '/' + cur, '');
        if (blobName.startsWith('/')) {
            blobName = blobName.substring(1);
        }
        const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
        if (await blockBlobClient.exists()) {
            await blockBlobClient.delete();
        }
        const totalSize = await this.getStorageSize(paths[0]);
        return { totalSize: totalSize / 1024 / 1024 };
    }
    async removeFolderFromStorage(...paths) {
        let prefix = paths.reduce((acc, cur) => acc + '/' + cur, '');
        if (prefix.startsWith('/')) {
            prefix = prefix.substring(1);
        }
        // Delete all blobs with the prefix
        for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
            await this.containerClient.deleteBlob(blob.name);
        }
        const totalSize = await this.getStorageSize(paths[0]);
        return { totalSize: totalSize / 1024 / 1024 };
    }
    async getStorageSize(orgId) {
        if (!orgId)
            return 0;
        let totalSize = 0;
        for await (const blob of this.containerClient.listBlobsFlat({ prefix: orgId })) {
            totalSize += blob.properties.contentLength || 0;
        }
        return totalSize;
    }
    getMulterStorage() {
        const connectionString = process.env.AZURE_BLOB_STORAGE_CONNECTION_STRING;
        let storageConfig = {
            containerName: this.containerName,
            blobName: async (_req, file) => `uploads/${(0, uuid_1.v4)()}/${file.originalname}`
        };
        // Use connection string if available, otherwise use account name/key
        if (connectionString && connectionString.trim() !== '') {
            storageConfig.connectionString = connectionString;
        }
        else {
            storageConfig.accountName = process.env.AZURE_BLOB_STORAGE_ACCOUNT_NAME;
            storageConfig.accessKey = process.env.AZURE_BLOB_STORAGE_ACCOUNT_KEY;
        }
        const azureStorage = new MulterAzureStorageWithPath(storageConfig);
        return (0, multer_1.default)({ storage: azureStorage });
    }
    getLoggerTransports(logType) {
        const connectionString = process.env.AZURE_BLOB_STORAGE_CONNECTION_STRING;
        const accountName = process.env.AZURE_BLOB_STORAGE_ACCOUNT_NAME;
        const accountKey = process.env.AZURE_BLOB_STORAGE_ACCOUNT_KEY;
        let baseConfig = { containerName: this.containerName };
        // Support both connection string and account name/key authentication
        if (connectionString && connectionString.trim() !== '') {
            baseConfig.account = { connectionString };
        }
        else {
            baseConfig.account = { name: accountName, key: accountKey };
        }
        if (logType === 'server') {
            return [
                (0, winston_azure_blob_1.winstonAzureBlob)({
                    ...baseConfig,
                    blobName: 'logs/server/server',
                    rotatePeriod: 'YYYY-MM-DD',
                    extension: '.log',
                    level: 'info'
                })
            ];
        }
        else if (logType === 'error') {
            return [
                (0, winston_azure_blob_1.winstonAzureBlob)({
                    ...baseConfig,
                    blobName: 'logs/error/server-error',
                    rotatePeriod: 'YYYY-MM-DD',
                    extension: '.log',
                    level: 'error'
                })
            ];
        }
        else if (logType === 'requests') {
            return [
                (0, winston_azure_blob_1.winstonAzureBlob)({
                    ...baseConfig,
                    blobName: 'logs/requests/server-requests',
                    rotatePeriod: 'YYYY-MM-DD',
                    extension: '.log.jsonl',
                    level: 'debug'
                })
            ];
        }
        else if (logType === 'audit') {
            return [
                (0, winston_azure_blob_1.winstonAzureBlob)({
                    ...baseConfig,
                    blobName: 'logs/audit/audit',
                    rotatePeriod: 'YYYY-MM-DD',
                    extension: '.log.jsonl',
                    level: 'info'
                })
            ];
        }
        return [];
    }
}
exports.AzureBlobStorageProvider = AzureBlobStorageProvider;
//# sourceMappingURL=AzureBlobStorageProvider.js.map