"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3StorageProvider = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const multer_1 = __importDefault(require("multer"));
const multer_s3_1 = __importDefault(require("multer-s3"));
const node_stream_1 = require("node:stream");
const uuid_1 = require("uuid");
const winston_1 = require("winston");
const BaseStorageProvider_1 = require("./BaseStorageProvider");
const { S3StreamLogger } = require('s3-streamlogger');
class S3StorageProvider extends BaseStorageProvider_1.BaseStorageProvider {
    constructor() {
        super();
        const config = this.initS3Config();
        this.s3Client = config.s3Client;
        this.bucket = config.bucket;
        this.s3Config = config.s3Config;
    }
    initS3Config() {
        const accessKeyId = process.env.S3_STORAGE_ACCESS_KEY_ID;
        const secretAccessKey = process.env.S3_STORAGE_SECRET_ACCESS_KEY;
        const region = process.env.S3_STORAGE_REGION;
        const bucket = process.env.S3_STORAGE_BUCKET_NAME;
        const customURL = process.env.S3_ENDPOINT_URL;
        const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';
        if (!region || region.trim() === '' || !bucket || bucket.trim() === '') {
            throw new Error('S3 storage configuration is missing');
        }
        const s3Config = {
            region: region,
            forcePathStyle: forcePathStyle
        };
        // Only include endpoint if customURL is not empty
        if (customURL && customURL.trim() !== '') {
            s3Config.endpoint = customURL;
        }
        if (accessKeyId && accessKeyId.trim() !== '' && secretAccessKey && secretAccessKey.trim() !== '') {
            s3Config.credentials = {
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey
            };
        }
        const s3Client = new client_s3_1.S3Client(s3Config);
        return { s3Client, bucket, s3Config };
    }
    getStorageType() {
        return 's3';
    }
    getConfig() {
        return {
            bucket: this.bucket,
            region: process.env.S3_STORAGE_REGION,
            endpoint: process.env.S3_ENDPOINT_URL
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
        const Key = orgId + '/' + chatflowid + '/' + sanitizedFilename;
        const putObjCmd = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key,
            ContentEncoding: 'base64',
            ContentType: mime,
            Body: bf
        });
        await this.s3Client.send(putObjCmd);
        fileNames.push(sanitizedFilename);
        const totalSize = await this.getStorageSize(orgId);
        return { path: 'FILE-STORAGE::' + JSON.stringify(fileNames), totalSize: totalSize / 1024 / 1024 };
    }
    async addArrayFilesToStorage(mime, bf, fileName, fileNames, ...paths) {
        const sanitizedFilename = this.sanitizeFilename(fileName);
        let Key = paths.reduce((acc, cur) => acc + '/' + cur, '') + '/' + sanitizedFilename;
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        const putObjCmd = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key,
            ContentEncoding: 'base64',
            ContentType: mime,
            Body: bf
        });
        await this.s3Client.send(putObjCmd);
        fileNames.push(sanitizedFilename);
        const totalSize = await this.getStorageSize(paths[0]);
        return { path: 'FILE-STORAGE::' + JSON.stringify(fileNames), totalSize: totalSize / 1024 / 1024 };
    }
    async addSingleFileToStorage(mime, bf, fileName, ...paths) {
        const sanitizedFilename = this.sanitizeFilename(fileName);
        let Key = paths.reduce((acc, cur) => acc + '/' + cur, '') + '/' + sanitizedFilename;
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        const putObjCmd = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key,
            ContentEncoding: 'base64',
            ContentType: mime,
            Body: bf
        });
        await this.s3Client.send(putObjCmd);
        const totalSize = await this.getStorageSize(paths[0]);
        return { path: 'FILE-STORAGE::' + sanitizedFilename, totalSize: totalSize / 1024 / 1024 };
    }
    async getFileFromUpload(filePath) {
        // For S3, the filePath is the S3 key
        let Key = filePath;
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        const getParams = {
            Bucket: this.bucket,
            Key
        };
        const response = await this.s3Client.send(new client_s3_1.GetObjectCommand(getParams));
        const body = response.Body;
        if (body instanceof node_stream_1.Readable) {
            const streamToString = await body.transformToString('base64');
            if (streamToString) {
                return Buffer.from(streamToString, 'base64');
            }
        }
        const byteArray = await response.Body.transformToByteArray();
        return Buffer.from(byteArray);
    }
    async getFileFromStorage(file, ...paths) {
        const sanitizedFilename = this.sanitizeFilename(file);
        let Key = paths.reduce((acc, cur) => acc + '/' + cur, '') + '/' + sanitizedFilename;
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        try {
            const getParams = {
                Bucket: this.bucket,
                Key
            };
            const response = await this.s3Client.send(new client_s3_1.GetObjectCommand(getParams));
            const body = response.Body;
            if (body instanceof node_stream_1.Readable) {
                const streamToString = await body.transformToString('base64');
                if (streamToString) {
                    return Buffer.from(streamToString, 'base64');
                }
            }
            const byteArray = await response.Body.transformToByteArray();
            return Buffer.from(byteArray);
        }
        catch (error) {
            // Fallback: Check if file exists without the first path element (likely orgId)
            if (paths.length > 1) {
                const fallbackPaths = paths.slice(1);
                let fallbackKey = fallbackPaths.reduce((acc, cur) => acc + '/' + cur, '') + '/' + sanitizedFilename;
                if (fallbackKey.startsWith('/')) {
                    fallbackKey = fallbackKey.substring(1);
                }
                try {
                    const fallbackParams = {
                        Bucket: this.bucket,
                        Key: fallbackKey
                    };
                    const fallbackResponse = await this.s3Client.send(new client_s3_1.GetObjectCommand(fallbackParams));
                    const fallbackBody = fallbackResponse.Body;
                    // Get the file content
                    let fileContent;
                    if (fallbackBody instanceof node_stream_1.Readable) {
                        const streamToString = await fallbackBody.transformToString('base64');
                        if (streamToString) {
                            fileContent = Buffer.from(streamToString, 'base64');
                        }
                        else {
                            const byteArray = await fallbackBody.transformToByteArray();
                            fileContent = Buffer.from(byteArray);
                        }
                    }
                    else {
                        const byteArray = await fallbackBody.transformToByteArray();
                        fileContent = Buffer.from(byteArray);
                    }
                    // Move to correct location with orgId
                    const putObjCmd = new client_s3_1.PutObjectCommand({
                        Bucket: this.bucket,
                        Key,
                        Body: fileContent
                    });
                    await this.s3Client.send(putObjCmd);
                    // Delete the old file
                    await this.s3Client.send(new client_s3_1.DeleteObjectsCommand({
                        Bucket: this.bucket,
                        Delete: {
                            Objects: [{ Key: fallbackKey }],
                            Quiet: false
                        }
                    }));
                    // Check if the directory is empty and delete recursively if needed
                    if (fallbackPaths.length > 0) {
                        await this.cleanEmptyS3Folders(fallbackPaths[0]);
                    }
                    return fileContent;
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
        const Key = orgId + '/' + chatflowId + '/' + chatId + '/' + sanitizedFilename;
        const getParams = {
            Bucket: this.bucket,
            Key
        };
        try {
            const response = await this.s3Client.send(new client_s3_1.GetObjectCommand(getParams));
            const body = response.Body;
            if (body instanceof node_stream_1.Readable) {
                const blob = await body.transformToByteArray();
                return Buffer.from(blob);
            }
        }
        catch (error) {
            // Fallback: Check if file exists without orgId
            const fallbackKey = chatflowId + '/' + chatId + '/' + sanitizedFilename;
            try {
                const fallbackParams = {
                    Bucket: this.bucket,
                    Key: fallbackKey
                };
                const fallbackResponse = await this.s3Client.send(new client_s3_1.GetObjectCommand(fallbackParams));
                const fallbackBody = fallbackResponse.Body;
                // If found, copy to correct location with orgId
                if (fallbackBody) {
                    let fileContent;
                    if (fallbackBody instanceof node_stream_1.Readable) {
                        const blob = await fallbackBody.transformToByteArray();
                        fileContent = Buffer.from(blob);
                    }
                    else {
                        const byteArray = await fallbackBody.transformToByteArray();
                        fileContent = Buffer.from(byteArray);
                    }
                    // Move to correct location with orgId
                    const putObjCmd = new client_s3_1.PutObjectCommand({
                        Bucket: this.bucket,
                        Key,
                        Body: fileContent
                    });
                    await this.s3Client.send(putObjCmd);
                    // Delete the old file
                    await this.s3Client.send(new client_s3_1.DeleteObjectsCommand({
                        Bucket: this.bucket,
                        Delete: {
                            Objects: [{ Key: fallbackKey }],
                            Quiet: false
                        }
                    }));
                    // Check if the directory is empty and delete recursively if needed
                    await this.cleanEmptyS3Folders(chatflowId);
                    return fileContent;
                }
            }
            catch (fallbackError) {
                throw new Error(`File ${fileName} not found`);
            }
        }
    }
    async getFilesListFromStorage(...paths) {
        let Key = paths.reduce((acc, cur) => acc + '/' + cur, '');
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        const listCommand = new client_s3_1.ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: Key
        });
        const list = await this.s3Client.send(listCommand);
        if (list.Contents && list.Contents.length > 0) {
            return list.Contents.map((item) => ({
                name: item.Key?.split('/').pop() || '',
                path: item.Key ?? '',
                size: item.Size || 0
            }));
        }
        else {
            return [];
        }
    }
    async removeFilesFromStorage(...paths) {
        let Key = paths.reduce((acc, cur) => acc + '/' + cur, '');
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        await this.deleteS3Folder(Key);
        const totalSize = await this.getStorageSize(paths[0]);
        return { totalSize: totalSize / 1024 / 1024 };
    }
    async removeSpecificFileFromUpload(filePath) {
        let Key = filePath;
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        await this.deleteS3Folder(Key);
    }
    async removeSpecificFileFromStorage(...paths) {
        let Key = paths.reduce((acc, cur) => acc + '/' + cur, '');
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        await this.deleteS3Folder(Key);
        const totalSize = await this.getStorageSize(paths[0]);
        return { totalSize: totalSize / 1024 / 1024 };
    }
    async removeFolderFromStorage(...paths) {
        let Key = paths.reduce((acc, cur) => acc + '/' + cur, '');
        if (Key.startsWith('/')) {
            Key = Key.substring(1);
        }
        await this.deleteS3Folder(Key);
        const totalSize = await this.getStorageSize(paths[0]);
        return { totalSize: totalSize / 1024 / 1024 };
    }
    async deleteS3Folder(location) {
        let count = 0;
        const recursiveS3Delete = async (token) => {
            const listCommand = new client_s3_1.ListObjectsV2Command({
                Bucket: this.bucket,
                Prefix: location,
                ContinuationToken: token
            });
            const list = await this.s3Client.send(listCommand);
            if (list.KeyCount) {
                const deleteCommand = new client_s3_1.DeleteObjectsCommand({
                    Bucket: this.bucket,
                    Delete: {
                        Objects: list.Contents?.map((item) => ({ Key: item.Key })),
                        Quiet: false
                    }
                });
                const deleted = await this.s3Client.send(deleteCommand);
                // @ts-ignore
                count += deleted.Deleted?.length || 0;
                if (deleted.Errors) {
                    deleted.Errors.map((error) => console.error(`${error.Key} could not be deleted - ${error.Code}`));
                }
            }
            if (list.NextContinuationToken) {
                return recursiveS3Delete(list.NextContinuationToken);
            }
            return `${count} files deleted from S3`;
        };
        return recursiveS3Delete();
    }
    async cleanEmptyS3Folders(prefix) {
        try {
            if (!prefix)
                return;
            const listCmd = new client_s3_1.ListObjectsV2Command({
                Bucket: this.bucket,
                Prefix: prefix + '/',
                Delimiter: '/'
            });
            const response = await this.s3Client.send(listCmd);
            if ((response.Contents?.length === 0 || !response.Contents) &&
                (response.CommonPrefixes?.length === 0 || !response.CommonPrefixes)) {
                await this.s3Client.send(new client_s3_1.DeleteObjectsCommand({
                    Bucket: this.bucket,
                    Delete: {
                        Objects: [{ Key: prefix + '/' }],
                        Quiet: true
                    }
                }));
                const parentPrefix = prefix.substring(0, prefix.lastIndexOf('/'));
                if (parentPrefix) {
                    await this.cleanEmptyS3Folders(parentPrefix);
                }
            }
        }
        catch (error) {
            console.error('Error cleaning empty S3 folders:', error);
        }
    }
    async getStorageSize(orgId) {
        if (!orgId)
            return 0;
        const getCmd = new client_s3_1.ListObjectsCommand({
            Bucket: this.bucket,
            Prefix: orgId
        });
        const headObj = await this.s3Client.send(getCmd);
        let totalSize = 0;
        for (const obj of headObj.Contents || []) {
            totalSize += obj.Size || 0;
        }
        return totalSize;
    }
    getMulterStorage() {
        return (0, multer_1.default)({
            storage: (0, multer_s3_1.default)({
                s3: this.s3Client,
                bucket: this.bucket,
                metadata: function (req, file, cb) {
                    cb(null, { fieldName: file.fieldname, originalName: file.originalname });
                },
                key: function (req, file, cb) {
                    cb(null, `${(0, uuid_1.v4)()}`);
                }
            })
        });
    }
    getLoggerTransports(logType) {
        if (logType === 'server') {
            const s3ServerStream = new S3StreamLogger({
                bucket: this.bucket,
                folder: 'logs/server',
                name_format: `server-%Y-%m-%d-%H-%M-%S-%L.log`,
                config: this.s3Config
            });
            return [new winston_1.transports.Stream({ stream: s3ServerStream })];
        }
        else if (logType === 'error') {
            const s3ErrorStream = new S3StreamLogger({
                bucket: this.bucket,
                folder: 'logs/error',
                name_format: `server-error-%Y-%m-%d-%H-%M-%S-%L.log`,
                config: this.s3Config
            });
            return [new winston_1.transports.Stream({ stream: s3ErrorStream })];
        }
        else if (logType === 'requests') {
            const s3ServerReqStream = new S3StreamLogger({
                bucket: this.bucket,
                folder: 'logs/requests',
                name_format: `server-requests-%Y-%m-%d-%H-%M-%S-%L.log.jsonl`,
                config: this.s3Config
            });
            return [new winston_1.transports.Stream({ stream: s3ServerReqStream })];
        }
        else if (logType === 'audit') {
            const instance = process.env.HOSTNAME || process.env.POD_NAME || String(process.pid);
            const s3AuditStream = new S3StreamLogger({
                bucket: this.bucket,
                folder: 'logs/audit',
                name_format: `audit-%Y-%m-%d-%H-%M-%S-%L-${instance}.log.jsonl`,
                config: this.s3Config
            });
            return [new winston_1.transports.Stream({ stream: s3AuditStream })];
        }
        return [];
    }
}
exports.S3StorageProvider = S3StorageProvider;
//# sourceMappingURL=S3StorageProvider.js.map