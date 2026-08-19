"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseStorageProvider = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const sanitize_filename_1 = __importDefault(require("sanitize-filename"));
const utils_1 = require("../utils");
const validator_1 = require("../validator");
class BaseStorageProvider {
    constructor() {
        this.storagePath = this.getStoragePath();
    }
    /**
     * Shared utility for sanitizing filenames to prevent path traversal and other issues
     */
    sanitizeFilename(filename) {
        if (!filename || (0, validator_1.isUnsafeFilePath)(filename)) {
            throw new Error('Invalid or unsafe fileName detected');
        }
        const sanitizedFilename = (0, sanitize_filename_1.default)(filename);
        // Remove leading dots to prevent hidden files or relative path jumps
        const cleaned = sanitizedFilename.replace(/^\.+/, '');
        if (!cleaned || cleaned.includes('/') || cleaned.includes('\\')) {
            throw new Error('Invalid filename after sanitization');
        }
        return cleaned;
    }
    /**
     * Shared utility for getting the base storage path
     */
    getStoragePath() {
        const storagePath = process.env.BLOB_STORAGE_PATH
            ? node_path_1.default.join(process.env.BLOB_STORAGE_PATH)
            : node_path_1.default.join((0, utils_1.getUserHome)(), '.flowise', 'storage');
        if (!node_fs_1.default.existsSync(storagePath)) {
            node_fs_1.default.mkdirSync(storagePath, { recursive: true });
        }
        return storagePath;
    }
    /**
     * Shared utility for validating chatflowId format (UUID)
     */
    validateChatflowId(chatflowId) {
        if (!chatflowId || !(0, validator_1.isValidUUID)(chatflowId)) {
            throw new Error('Invalid chatflowId format - must be a valid UUID');
        }
    }
    /**
     * Shared utility for checking path traversal attempts
     */
    validatePathSecurity(...paths) {
        for (const p of paths) {
            if (p && (0, validator_1.isPathTraversal)(p)) {
                throw new Error('Invalid path characters detected');
            }
        }
    }
    /**
     * Shared utility for building a storage path from components
     */
    buildPath(...paths) {
        const sanitizedPaths = paths.filter((p) => p && typeof p === 'string').map((p) => this.sanitizeFilename(p));
        return node_path_1.default.join(this.storagePath, ...sanitizedPaths);
    }
}
exports.BaseStorageProvider = BaseStorageProvider;
//# sourceMappingURL=BaseStorageProvider.js.map