"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageKitStorageProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const imagekit_1 = __importDefault(require("imagekit"));
const multer_1 = __importDefault(require("multer"));
const winston_transport_1 = __importDefault(require("winston-transport"));
const uuid_1 = require("uuid");
const BaseStorageProvider_1 = require("./BaseStorageProvider");
/**
 * Multer storage engine backed by ImageKit. No official multer-imagekit package exists,
 * so this hand-rolls the engine contract (_handleFile/_removeFile) that multer duck-types.
 */
class ImageKitMulterStorage {
    constructor(imagekit) {
        this.imagekit = imagekit;
    }
    _handleFile(_req, file, cb) {
        const chunks = [];
        // Buffer the full upload in memory - ImageKit's SDK does not accept a raw stream for 'file'
        file.stream.on('data', (chunk) => chunks.push(chunk));
        file.stream.on('error', (err) => cb(err));
        file.stream.on('end', () => {
            const buffer = Buffer.concat(chunks);
            this.imagekit
                .upload({
                file: buffer,
                fileName: file.originalname,
                folder: `/uploads/${(0, uuid_1.v4)()}`,
                useUniqueFileName: false,
                overwriteFile: true
            })
                .then((result) => {
                // Store the ImageKit fileId in file.path - getFileFromUpload/removeSpecificFileFromUpload
                // key off this value for the ephemeral multer-upload flow
                cb(null, { path: result.fileId, size: buffer.length, filename: file.originalname });
            })
                .catch((err) => cb(err));
        });
    }
    _removeFile(_req, file, cb) {
        this.imagekit
            .deleteFile(file.path)
            .then(() => cb(null))
            .catch((err) => cb(err));
    }
}
/**
 * Minimal Winston transport for ImageKit. ImageKit has no logging product, so this
 * buffers log lines and periodically uploads them as a single dated file per log type -
 * best-effort, not a critical-path guarantee (unlike GCS/Azure's real logging integrations).
 */
class ImageKitLogTransport extends winston_transport_1.default {
    constructor(imagekit, logType, opts) {
        super(opts);
        this.imagekit = imagekit;
        this.logType = logType;
        this.buffer = [];
        this.flushTimer = setInterval(() => this.flush(), 30000);
        this.flushTimer.unref();
    }
    log(info, callback) {
        setImmediate(() => this.emit('logged', info));
        this.buffer.push(`${info.timestamp ?? new Date().toISOString()} [${info.level}] ${info.message}`);
        callback();
    }
    flush() {
        if (this.buffer.length === 0)
            return;
        const lines = this.buffer.splice(0, this.buffer.length);
        this.imagekit
            .upload({
            file: Buffer.from(lines.join('\n'), 'utf-8'),
            fileName: `${Date.now()}.log`,
            folder: `/logs/${this.logType}`,
            useUniqueFileName: false,
            overwriteFile: true
        })
            .catch((err) => {
            console.error(`Error logging to ImageKit (${this.logType}):`, err);
        });
    }
}
class ImageKitStorageProvider extends BaseStorageProvider_1.BaseStorageProvider {
    constructor() {
        super();
        const config = this.initImageKitConfig();
        this.imagekit = config.imagekit;
        this.urlEndpoint = config.urlEndpoint;
    }
    initImageKitConfig() {
        const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
        const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
        const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
        if (!publicKey || !privateKey || !urlEndpoint) {
            throw new Error('IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT env variables are required');
        }
        const imagekit = new imagekit_1.default({ publicKey, privateKey, urlEndpoint });
        return { imagekit, urlEndpoint: urlEndpoint.replace(/\/+$/, '') };
    }
    getStorageType() {
        return 'imagekit';
    }
    getConfig() {
        return { urlEndpoint: this.urlEndpoint };
    }
    normalizeSegment(p) {
        return p.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
    }
    buildFolderPath(...paths) {
        return ('/' +
            paths
                .map((p) => this.normalizeSegment(p))
                .filter(Boolean)
                .join('/'));
    }
    async downloadByUrl(url) {
        const response = await axios_1.default.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    }
    async listAllFiles(folder) {
        const results = [];
        const limit = 1000;
        let skip = 0;
        for (;;) {
            const page = await this.imagekit.listFiles({ path: folder, limit, skip });
            results.push(...page);
            if (page.length < limit)
                break;
            skip += limit;
        }
        return results;
    }
    async addBase64FilesToStorage(fileBase64, chatflowid, fileNames, orgId) {
        this.validateChatflowId(chatflowid);
        this.validatePathSecurity(chatflowid);
        const splitDataURI = fileBase64.split(',');
        const filename = splitDataURI.pop()?.split(':')[1] ?? '';
        const bf = Buffer.from(splitDataURI.pop() || '', 'base64');
        const sanitizedFilename = this.sanitizeFilename(filename);
        const folder = this.buildFolderPath(orgId, chatflowid);
        await this.imagekit.upload({
            file: bf,
            fileName: sanitizedFilename,
            folder,
            useUniqueFileName: false,
            overwriteFile: true
        });
        fileNames.push(sanitizedFilename);
        const totalSize = await this.getStorageSize(orgId);
        return { path: 'FILE-STORAGE::' + JSON.stringify(fileNames), totalSize: totalSize / 1024 / 1024 };
    }
    async addArrayFilesToStorage(mime, bf, fileName, fileNames, ...paths) {
        const sanitizedFilename = this.sanitizeFilename(fileName);
        const folder = this.buildFolderPath(...paths);
        await this.imagekit.upload({
            file: bf,
            fileName: sanitizedFilename,
            folder,
            useUniqueFileName: false,
            overwriteFile: true
        });
        fileNames.push(sanitizedFilename);
        const totalSize = await this.getStorageSize(paths[0]);
        return { path: 'FILE-STORAGE::' + JSON.stringify(fileNames), totalSize: totalSize / 1024 / 1024 };
    }
    async addSingleFileToStorage(mime, bf, fileName, ...paths) {
        const sanitizedFilename = this.sanitizeFilename(fileName);
        const folder = this.buildFolderPath(...paths);
        await this.imagekit.upload({
            file: bf,
            fileName: sanitizedFilename,
            folder,
            useUniqueFileName: false,
            overwriteFile: true
        });
        const totalSize = await this.getStorageSize(paths[0]);
        return { path: 'FILE-STORAGE::' + sanitizedFilename, totalSize: totalSize / 1024 / 1024 };
    }
    async getFileFromUpload(filePath) {
        // filePath is the ImageKit fileId set by ImageKitMulterStorage, not a folder path
        const details = await this.imagekit.getFileDetails(filePath);
        return this.downloadByUrl(details.url);
    }
    async getFileFromStorage(file, ...paths) {
        const sanitizedFilename = this.sanitizeFilename(file);
        const folder = this.buildFolderPath(...paths);
        return this.downloadByUrl(`${this.urlEndpoint}${folder}/${sanitizedFilename}`);
    }
    async streamStorageFile(chatflowId, chatId, fileName, orgId) {
        this.validateChatflowId(chatflowId);
        this.validatePathSecurity(chatflowId, chatId);
        const sanitizedFilename = this.sanitizeFilename(fileName);
        const folder = this.buildFolderPath(orgId, chatflowId, chatId);
        try {
            return await this.downloadByUrl(`${this.urlEndpoint}${folder}/${sanitizedFilename}`);
        }
        catch (error) {
            throw new Error(`File ${fileName} not found`);
        }
    }
    async getFilesListFromStorage(...paths) {
        const folder = this.buildFolderPath(...paths);
        const files = await this.listAllFiles(folder);
        return files
            .filter((f) => f.type === 'file')
            .map((f) => ({
            name: f.name,
            path: `${folder}/${f.name}`,
            size: f.size || 0
        }));
    }
    async removeFilesFromStorage(...paths) {
        const folder = this.buildFolderPath(...paths);
        try {
            await this.imagekit.deleteFolder(folder);
        }
        catch (error) {
            // Folder may not exist - ignore
        }
        const totalSize = await this.getStorageSize(paths[0]);
        return { totalSize: totalSize / 1024 / 1024 };
    }
    async removeSpecificFileFromUpload(filePath) {
        // filePath is the ImageKit fileId set by ImageKitMulterStorage, not a folder path
        await this.imagekit.deleteFile(filePath);
    }
    async removeSpecificFileFromStorage(...paths) {
        const fileName = paths.pop();
        const sanitizedFilename = fileName ? this.sanitizeFilename(fileName) : '';
        const folder = this.buildFolderPath(...paths);
        // ImageKit has no delete-by-path API for a single file - look up its fileId first
        const files = await this.listAllFiles(folder);
        const match = files.find((f) => f.name === sanitizedFilename);
        if (match) {
            await this.imagekit.deleteFile(match.fileId);
        }
        const totalSize = await this.getStorageSize(paths[0]);
        return { totalSize: totalSize / 1024 / 1024 };
    }
    async removeFolderFromStorage(...paths) {
        const folder = this.buildFolderPath(...paths);
        try {
            await this.imagekit.deleteFolder(folder);
        }
        catch (error) {
            // Folder may not exist - ignore
        }
        const totalSize = await this.getStorageSize(paths[0]);
        return { totalSize: totalSize / 1024 / 1024 };
    }
    async getStorageSize(orgId) {
        if (!orgId)
            return 0;
        const folder = this.buildFolderPath(orgId);
        const files = await this.listAllFiles(folder);
        return files.reduce((total, f) => total + (f.size || 0), 0);
    }
    getMulterStorage() {
        return (0, multer_1.default)({ storage: new ImageKitMulterStorage(this.imagekit) });
    }
    getLoggerTransports(logType) {
        const level = logType === 'error' ? 'error' : logType === 'requests' || logType === 'audit' ? 'debug' : 'info';
        return [new ImageKitLogTransport(this.imagekit, logType, { level })];
    }
}
exports.ImageKitStorageProvider = ImageKitStorageProvider;
//# sourceMappingURL=ImageKitStorageProvider.js.map