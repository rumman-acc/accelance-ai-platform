'use strict'
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod }
    }
Object.defineProperty(exports, '__esModule', { value: true })
exports.getStorageSize =
    exports.streamStorageFile =
    exports.removeFolderFromStorage =
    exports.removeSpecificFileFromStorage =
    exports.removeSpecificFileFromUpload =
    exports.removeFilesFromStorage =
    exports.getStorageType =
    exports.getModelsCachePath =
    exports.getStoragePath =
    exports.getFilesListFromStorage =
    exports.getFileFromStorage =
    exports.getFileFromUpload =
    exports.addSingleFileToStorage =
    exports.addArrayFilesToStorage =
    exports.addBase64FilesToStorage =
        void 0
const fs_1 = __importDefault(require('fs'))
const path_1 = __importDefault(require('path'))
const utils_1 = require('./utils')
const storage_1 = require('./storage')
const addBase64FilesToStorage = async (fileBase64, chatflowid, fileNames, orgId) => {
    const provider = storage_1.StorageProviderFactory.getProvider()
    return provider.addBase64FilesToStorage(fileBase64, chatflowid, fileNames, orgId)
}
exports.addBase64FilesToStorage = addBase64FilesToStorage
const addArrayFilesToStorage = async (mime, bf, fileName, fileNames, ...paths) => {
    const provider = storage_1.StorageProviderFactory.getProvider()
    return provider.addArrayFilesToStorage(mime, bf, fileName, fileNames, ...paths)
}
exports.addArrayFilesToStorage = addArrayFilesToStorage
const addSingleFileToStorage = async (mime, bf, fileName, ...paths) => {
    const provider = storage_1.StorageProviderFactory.getProvider()
    return provider.addSingleFileToStorage(mime, bf, fileName, ...paths)
}
exports.addSingleFileToStorage = addSingleFileToStorage
const getFileFromUpload = async (filePath) => {
    const provider = storage_1.StorageProviderFactory.getProvider()
    return provider.getFileFromUpload(filePath)
}
exports.getFileFromUpload = getFileFromUpload
const getFileFromStorage = async (file, ...paths) => {
    const provider = storage_1.StorageProviderFactory.getProvider()
    return provider.getFileFromStorage(file, ...paths)
}
exports.getFileFromStorage = getFileFromStorage
const getFilesListFromStorage = async (...paths) => {
    const provider = storage_1.StorageProviderFactory.getProvider()
    return provider.getFilesListFromStorage(...paths)
}
exports.getFilesListFromStorage = getFilesListFromStorage
/**
 * Prepare storage path
 */
const getStoragePath = () => {
    const storagePath = process.env.BLOB_STORAGE_PATH
        ? path_1.default.join(process.env.BLOB_STORAGE_PATH)
        : path_1.default.join((0, utils_1.getUserHome)(), '.flowise', 'storage')
    if (!fs_1.default.existsSync(storagePath)) {
        fs_1.default.mkdirSync(storagePath, { recursive: true })
    }
    return storagePath
}
exports.getStoragePath = getStoragePath
/**
 * Path to the locally-cached, periodically-refreshed model list (see refreshModelList job in
 * packages/server). Independent of getStoragePath() since it's server-local metadata, not
 * user-uploaded content, and must exist regardless of STORAGE_TYPE (local vs cloud).
 */
const getModelsCachePath = () => {
    const cacheDir = process.env.MODEL_CACHE_DIR
        ? path_1.default.join(process.env.MODEL_CACHE_DIR)
        : path_1.default.join((0, utils_1.getUserHome)(), '.flowise')
    if (!fs_1.default.existsSync(cacheDir)) {
        fs_1.default.mkdirSync(cacheDir, { recursive: true })
    }
    return path_1.default.join(cacheDir, 'models-cache.json')
}
exports.getModelsCachePath = getModelsCachePath
/**
 * Get the storage type - local or cloud
 */
const getStorageType = () => {
    return process.env.STORAGE_TYPE ? process.env.STORAGE_TYPE : 'local'
}
exports.getStorageType = getStorageType
const removeFilesFromStorage = async (...paths) => {
    const provider = storage_1.StorageProviderFactory.getProvider()
    return provider.removeFilesFromStorage(...paths)
}
exports.removeFilesFromStorage = removeFilesFromStorage
const removeSpecificFileFromUpload = async (filePath) => {
    const provider = storage_1.StorageProviderFactory.getProvider()
    return provider.removeSpecificFileFromUpload(filePath)
}
exports.removeSpecificFileFromUpload = removeSpecificFileFromUpload
const removeSpecificFileFromStorage = async (...paths) => {
    const provider = storage_1.StorageProviderFactory.getProvider()
    return provider.removeSpecificFileFromStorage(...paths)
}
exports.removeSpecificFileFromStorage = removeSpecificFileFromStorage
const removeFolderFromStorage = async (...paths) => {
    const provider = storage_1.StorageProviderFactory.getProvider()
    return provider.removeFolderFromStorage(...paths)
}
exports.removeFolderFromStorage = removeFolderFromStorage
const streamStorageFile = async (chatflowId, chatId, fileName, orgId) => {
    const provider = storage_1.StorageProviderFactory.getProvider()
    return provider.streamStorageFile(chatflowId, chatId, fileName, orgId)
}
exports.streamStorageFile = streamStorageFile
/**
 * Get the total storage size for an organization (unified across all providers)
 */
const getStorageSize = async (orgId) => {
    const provider = storage_1.StorageProviderFactory.getProvider()
    return provider.getStorageSize(orgId)
}
exports.getStorageSize = getStorageSize
//# sourceMappingURL=storageUtils.js.map
