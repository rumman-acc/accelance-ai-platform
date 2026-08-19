"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GCSStorageProvider = void 0;
const logging_winston_1 = require("@google-cloud/logging-winston");
const storage_1 = require("@google-cloud/storage");
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const BaseStorageProvider_1 = require("./BaseStorageProvider");
const multer_cloud_storage_1 = __importDefault(require("multer-cloud-storage"));
class GCSStorageProvider extends BaseStorageProvider_1.BaseStorageProvider {
    constructor() {
        super();
        const config = this.initGCSConfig();
        this.bucket = config.bucket;
        this.bucketName = config.bucketName;
        this.projectId = config.projectId;
        this.keyFilename = config.keyFilename;
    }
    initGCSConfig() {
        const keyFilename = process.env.GOOGLE_CLOUD_STORAGE_CREDENTIAL;
        const projectId = process.env.GOOGLE_CLOUD_STORAGE_PROJ_ID;
        const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET_NAME;
        if (!bucketName) {
            throw new Error('GOOGLE_CLOUD_STORAGE_BUCKET_NAME env variable is required');
        }
        const storageConfig = {
            ...(keyFilename ? { keyFilename } : {}),
            ...(projectId ? { projectId } : {})
        };
        const storage = new storage_1.Storage(storageConfig);
        const bucket = storage.bucket(bucketName);
        return { bucket, bucketName, projectId, keyFilename };
    }
    getStorageType() {
        return 'gcs';
    }
    getConfig() {
        return {
            bucketName: this.bucketName,
            projectId: this.projectId
        };
    }
    normalizePath(p) {
        return p.replace(/\\/g, '/');
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
        const normalizedChatflowid = this.normalizePath(chatflowid);
        const normalizedFilename = this.normalizePath(sanitizedFilename);
        const filePath = `${orgId}/${normalizedChatflowid}/${normalizedFilename}`;
        const file = this.bucket.file(filePath);
        await new Promise((resolve, reject) => {
            file.createWriteStream({ contentType: mime, metadata: { contentEncoding: 'base64' } })
                .on('error', (err) => reject(err))
                .on('finish', () => resolve())
                .end(bf);
        });
        fileNames.push(sanitizedFilename);
        const totalSize = await this.getStorageSize(orgId);
        return { path: 'FILE-STORAGE::' + JSON.stringify(fileNames), totalSize: totalSize / 1024 / 1024 };
    }
    async addArrayFilesToStorage(mime, bf, fileName, fileNames, ...paths) {
        const sanitizedFilename = this.sanitizeFilename(fileName);
        const normalizedPaths = paths.map((p) => this.normalizePath(p));
        const normalizedFilename = this.normalizePath(sanitizedFilename);
        const filePath = [...normalizedPaths, normalizedFilename].join('/');
        const file = this.bucket.file(filePath);
        await new Promise((resolve, reject) => {
            file.createWriteStream()
                .on('error', (err) => reject(err))
                .on('finish', () => resolve())
                .end(bf);
        });
        fileNames.push(sanitizedFilename);
        const totalSize = await this.getStorageSize(paths[0]);
        return { path: 'FILE-STORAGE::' + JSON.stringify(fileNames), totalSize: totalSize / 1024 / 1024 };
    }
    async addSingleFileToStorage(mime, bf, fileName, ...paths) {
        const sanitizedFilename = this.sanitizeFilename(fileName);
        const normalizedPaths = paths.map((p) => this.normalizePath(p));
        const normalizedFilename = this.normalizePath(sanitizedFilename);
        const filePath = [...normalizedPaths, normalizedFilename].join('/');
        const file = this.bucket.file(filePath);
        await new Promise((resolve, reject) => {
            file.createWriteStream({ contentType: mime, metadata: { contentEncoding: 'base64' } })
                .on('error', (err) => reject(err))
                .on('finish', () => resolve())
                .end(bf);
        });
        const totalSize = await this.getStorageSize(paths[0]);
        return { path: 'FILE-STORAGE::' + sanitizedFilename, totalSize: totalSize / 1024 / 1024 };
    }
    async getFileFromUpload(filePath) {
        const file = this.bucket.file(filePath);
        const [buffer] = await file.download();
        return buffer;
    }
    async getFileFromStorage(file, ...paths) {
        const sanitizedFilename = this.sanitizeFilename(file);
        const normalizedPaths = paths.map((p) => this.normalizePath(p));
        const normalizedFilename = this.normalizePath(sanitizedFilename);
        const filePath = [...normalizedPaths, normalizedFilename].join('/');
        try {
            const gcsFile = this.bucket.file(filePath);
            const [buffer] = await gcsFile.download();
            return buffer;
        }
        catch (error) {
            // Fallback: Check if file exists without the first path element (likely orgId)
            if (normalizedPaths.length > 1) {
                const fallbackPaths = normalizedPaths.slice(1);
                const fallbackPath = [...fallbackPaths, normalizedFilename].join('/');
                try {
                    const fallbackFile = this.bucket.file(fallbackPath);
                    const [buffer] = await fallbackFile.download();
                    // Move to correct location with orgId
                    const gcsFile = this.bucket.file(filePath);
                    await new Promise((resolve, reject) => {
                        gcsFile
                            .createWriteStream()
                            .on('error', (err) => reject(err))
                            .on('finish', () => resolve())
                            .end(buffer);
                    });
                    // Delete the old file
                    await fallbackFile.delete();
                    // Check if the directory is empty and delete recursively if needed
                    if (fallbackPaths.length > 0) {
                        await this.cleanEmptyGCSFolders(fallbackPaths[0]);
                    }
                    return buffer;
                }
                catch (fallbackError) {
                    throw error;
                }
            }
            else {
                throw error;
            }
        }
    }
    async streamStorageFile(chatflowId, chatId, fileName, orgId) {
        // Validate chatflowId and chatId
        this.validateChatflowId(chatflowId);
        this.validatePathSecurity(chatflowId, chatId);
        const sanitizedFilename = this.sanitizeFilename(fileName);
        const normalizedChatflowId = this.normalizePath(chatflowId);
        const normalizedChatId = this.normalizePath(chatId);
        const normalizedFilename = this.normalizePath(sanitizedFilename);
        const filePath = `${orgId}/${normalizedChatflowId}/${normalizedChatId}/${normalizedFilename}`;
        try {
            const [buffer] = await this.bucket.file(filePath).download();
            return buffer;
        }
        catch (error) {
            // Fallback: Check if file exists without orgId
            const fallbackPath = `${normalizedChatflowId}/${normalizedChatId}/${normalizedFilename}`;
            try {
                const fallbackFile = this.bucket.file(fallbackPath);
                const [buffer] = await fallbackFile.download();
                // If found, copy to correct location with orgId
                if (buffer) {
                    const file = this.bucket.file(filePath);
                    await new Promise((resolve, reject) => {
                        file.createWriteStream()
                            .on('error', (err) => reject(err))
                            .on('finish', () => resolve())
                            .end(buffer);
                    });
                    // Delete the old file
                    await fallbackFile.delete();
                    // Check if the directory is empty and delete recursively if needed
                    await this.cleanEmptyGCSFolders(normalizedChatflowId);
                    return buffer;
                }
            }
            catch (fallbackError) {
                throw new Error(`File ${fileName} not found`);
            }
        }
    }
    async getFilesListFromStorage(...paths) {
        const normalizedPaths = paths.map((p) => this.normalizePath(p));
        const prefix = normalizedPaths.join('/');
        const [files] = await this.bucket.getFiles({ prefix });
        return files.map((file) => ({
            name: file.name.split('/').pop() || '',
            path: file.name,
            size: typeof file.metadata.size === 'string' ? parseInt(file.metadata.size, 10) || 0 : file.metadata.size || 0
        }));
    }
    async removeFilesFromStorage(...paths) {
        const normalizedPath = paths.map((p) => this.normalizePath(p)).join('/');
        await this.bucket.deleteFiles({ prefix: `${normalizedPath}/` });
        const totalSize = await this.getStorageSize(paths[0]);
        return { totalSize: totalSize / 1024 / 1024 };
    }
    async removeSpecificFileFromUpload(filePath) {
        await this.bucket.file(filePath).delete();
    }
    async removeSpecificFileFromStorage(...paths) {
        const fileName = paths.pop();
        if (fileName) {
            const sanitizedFilename = this.sanitizeFilename(fileName);
            paths.push(sanitizedFilename);
        }
        const normalizedPath = paths.map((p) => this.normalizePath(p)).join('/');
        await this.bucket.file(normalizedPath).delete();
        const totalSize = await this.getStorageSize(paths[0]);
        return { totalSize: totalSize / 1024 / 1024 };
    }
    async removeFolderFromStorage(...paths) {
        const normalizedPath = paths.map((p) => this.normalizePath(p)).join('/');
        await this.bucket.deleteFiles({ prefix: `${normalizedPath}/` });
        const totalSize = await this.getStorageSize(paths[0]);
        return { totalSize: totalSize / 1024 / 1024 };
    }
    async cleanEmptyGCSFolders(prefix) {
        try {
            if (!prefix)
                return;
            const [files] = await this.bucket.getFiles({
                prefix: prefix + '/',
                delimiter: '/'
            });
            if (files.length === 0) {
                try {
                    await this.bucket.file(prefix + '/').delete();
                }
                catch (err) {
                    // Folder marker might not exist, ignore
                }
                const parentPrefix = prefix.substring(0, prefix.lastIndexOf('/'));
                if (parentPrefix) {
                    await this.cleanEmptyGCSFolders(parentPrefix);
                }
            }
        }
        catch (error) {
            console.error('Error cleaning empty GCS folders:', error);
        }
    }
    async getStorageSize(orgId) {
        if (!orgId)
            return 0;
        const [files] = await this.bucket.getFiles({ prefix: orgId });
        let totalSize = 0;
        for (const file of files) {
            const size = file.metadata.size;
            if (typeof size === 'string') {
                totalSize += parseInt(size, 10) || 0;
            }
            else if (typeof size === 'number') {
                totalSize += size;
            }
        }
        return totalSize;
    }
    getMulterStorage() {
        return (0, multer_1.default)({
            storage: new multer_cloud_storage_1.default({
                projectId: this.projectId,
                bucket: this.bucketName,
                keyFilename: this.keyFilename,
                uniformBucketLevelAccess: Boolean(process.env.GOOGLE_CLOUD_UNIFORM_BUCKET_ACCESS) ?? true,
                destination: `uploads/${(0, uuid_1.v4)()}`
            })
        });
    }
    getLoggerTransports(logType) {
        const gcsConfig = {
            projectId: this.projectId,
            keyFilename: this.keyFilename,
            defaultCallback: (err) => {
                if (err) {
                    console.error('Error logging to GCS: ' + err);
                }
            }
        };
        if (logType === 'server') {
            return [
                new logging_winston_1.LoggingWinston({
                    ...gcsConfig,
                    logName: 'server'
                })
            ];
        }
        else if (logType === 'error') {
            return [
                new logging_winston_1.LoggingWinston({
                    ...gcsConfig,
                    logName: 'error'
                })
            ];
        }
        else if (logType === 'requests') {
            return [
                new logging_winston_1.LoggingWinston({
                    ...gcsConfig,
                    logName: 'requests'
                })
            ];
        }
        else if (logType === 'audit') {
            return [
                new logging_winston_1.LoggingWinston({
                    ...gcsConfig,
                    logName: 'audit'
                })
            ];
        }
        return [];
    }
}
exports.GCSStorageProvider = GCSStorageProvider;
//# sourceMappingURL=GCSStorageProvider.js.map