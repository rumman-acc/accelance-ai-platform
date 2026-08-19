'use strict'
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod }
    }
Object.defineProperty(exports, '__esModule', { value: true })
exports.LocalStorageProvider = void 0
const fs_1 = __importDefault(require('fs'))
const multer_1 = __importDefault(require('multer'))
const node_path_1 = __importDefault(require('node:path'))
const winston_1 = require('winston')
const winston_daily_rotate_file_1 = __importDefault(require('winston-daily-rotate-file'))
const BaseStorageProvider_1 = require('./BaseStorageProvider')
class LocalStorageProvider extends BaseStorageProvider_1.BaseStorageProvider {
    constructor() {
        super()
    }
    getStorageType() {
        return 'local'
    }
    getConfig() {
        return {
            storagePath: this.storagePath
        }
    }
    async addBase64FilesToStorage(fileBase64, chatflowid, fileNames, orgId) {
        // Validate chatflowid
        this.validateChatflowId(chatflowid)
        this.validatePathSecurity(chatflowid)
        const dir = this.buildPath(orgId, chatflowid)
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true })
        }
        const splitDataURI = fileBase64.split(',')
        const filename = splitDataURI.pop()?.split(':')[1] ?? ''
        const bf = Buffer.from(splitDataURI.pop() || '', 'base64')
        const sanitizedFilename = this.sanitizeFilename(filename)
        const filePath = node_path_1.default.join(dir, sanitizedFilename)
        fs_1.default.writeFileSync(filePath, bf)
        fileNames.push(sanitizedFilename)
        const totalSize = await this.getStorageSize(orgId)
        return { path: 'FILE-STORAGE::' + JSON.stringify(fileNames), totalSize: totalSize / 1024 / 1024 }
    }
    async addArrayFilesToStorage(mime, bf, fileName, fileNames, ...paths) {
        const dir = this.buildPath(...paths)
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true })
        }
        const sanitizedFilename = this.sanitizeFilename(fileName)
        const filePath = node_path_1.default.join(dir, sanitizedFilename)
        fs_1.default.writeFileSync(filePath, bf)
        fileNames.push(sanitizedFilename)
        const totalSize = await this.getStorageSize(paths[0])
        return { path: 'FILE-STORAGE::' + JSON.stringify(fileNames), totalSize: totalSize / 1024 / 1024 }
    }
    async addSingleFileToStorage(mime, bf, fileName, ...paths) {
        const dir = this.buildPath(...paths)
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true })
        }
        const sanitizedFilename = this.sanitizeFilename(fileName)
        const filePath = node_path_1.default.join(dir, sanitizedFilename)
        fs_1.default.writeFileSync(filePath, bf)
        const totalSize = await this.getStorageSize(paths[0])
        return { path: 'FILE-STORAGE::' + sanitizedFilename, totalSize: totalSize / 1024 / 1024 }
    }
    async getFileFromUpload(filePath) {
        return fs_1.default.readFileSync(filePath)
    }
    async getFileFromStorage(file, ...paths) {
        const sanitizedFilename = this.sanitizeFilename(file)
        const fileInStorage = this.buildPath(...paths.map((p) => this.sanitizeFilename(p)), sanitizedFilename)
        try {
            return fs_1.default.readFileSync(fileInStorage)
        } catch (error) {
            // Fallback: Check if file exists without the first path element (likely orgId)
            if (paths.length > 1) {
                const fallbackPaths = paths.slice(1)
                const fallbackPath = this.buildPath(...fallbackPaths.map((p) => this.sanitizeFilename(p)), sanitizedFilename)
                if (fs_1.default.existsSync(fallbackPath)) {
                    // Create directory if it doesn't exist
                    const targetPath = fileInStorage
                    const dir = node_path_1.default.dirname(targetPath)
                    if (!fs_1.default.existsSync(dir)) {
                        fs_1.default.mkdirSync(dir, { recursive: true })
                    }
                    // Copy file to correct location with orgId
                    fs_1.default.copyFileSync(fallbackPath, targetPath)
                    // Delete the old file
                    fs_1.default.unlinkSync(fallbackPath)
                    // Clean up empty directories recursively
                    if (fallbackPaths.length > 0) {
                        this.cleanEmptyLocalFolders(this.buildPath(...fallbackPaths.map((p) => this.sanitizeFilename(p)).slice(0, -1)))
                    }
                    return fs_1.default.readFileSync(targetPath)
                }
            }
            throw error
        }
    }
    async streamStorageFile(chatflowId, chatId, fileName, orgId) {
        // Validate chatflowId and chatId
        this.validateChatflowId(chatflowId)
        this.validatePathSecurity(chatflowId, chatId)
        const sanitizedFilename = this.sanitizeFilename(fileName)
        const filePath = this.buildPath(orgId, chatflowId, chatId, sanitizedFilename)
        //raise error if file path is not absolute
        if (!node_path_1.default.isAbsolute(filePath)) throw new Error(`Invalid file path`)
        //raise error if file path contains '..'
        if (filePath.includes('..')) throw new Error(`Invalid file path`)
        //only return from the storage folder
        if (!filePath.startsWith(this.storagePath)) throw new Error(`Invalid file path`)
        if (fs_1.default.existsSync(filePath)) {
            return fs_1.default.createReadStream(filePath)
        } else {
            // Fallback: Check if file exists without orgId
            const fallbackPath = this.buildPath(chatflowId, chatId, sanitizedFilename)
            if (fs_1.default.existsSync(fallbackPath)) {
                // Create directory if it doesn't exist
                const dir = node_path_1.default.dirname(filePath)
                if (!fs_1.default.existsSync(dir)) {
                    fs_1.default.mkdirSync(dir, { recursive: true })
                }
                // Copy file to correct location with orgId
                fs_1.default.copyFileSync(fallbackPath, filePath)
                // Delete the old file
                fs_1.default.unlinkSync(fallbackPath)
                // Clean up empty directories recursively
                this.cleanEmptyLocalFolders(node_path_1.default.dirname(fallbackPath))
                return fs_1.default.createReadStream(filePath)
            } else {
                throw new Error(`File ${fileName} not found`)
            }
        }
    }
    async getFilesListFromStorage(...paths) {
        const directory = this.buildPath(...paths)
        return this.getFilePaths(directory)
    }
    getFilePaths(dir) {
        let results = []
        const readDirectory = (directory) => {
            try {
                if (!fs_1.default.existsSync(directory)) {
                    console.warn(`Directory does not exist: ${directory}`)
                    return
                }
                const list = fs_1.default.readdirSync(directory)
                list.forEach((file) => {
                    const filePath = node_path_1.default.join(directory, file)
                    try {
                        const stat = fs_1.default.statSync(filePath)
                        if (stat && stat.isDirectory()) {
                            readDirectory(filePath)
                        } else {
                            results.push({ name: file, path: filePath, size: stat.size })
                        }
                    } catch (error) {
                        console.error(`Error processing file ${filePath}:`, error)
                    }
                })
            } catch (error) {
                console.error(`Error reading directory ${directory}:`, error)
            }
        }
        readDirectory(dir)
        return results
    }
    cleanEmptyLocalFolders(dirPath) {
        try {
            // Stop if we reach the storage root
            if (dirPath === this.storagePath) return
            // Check if directory exists
            if (!fs_1.default.existsSync(dirPath)) return
            // Read directory contents
            const files = fs_1.default.readdirSync(dirPath)
            // If directory is empty, delete it and check parent
            if (files.length === 0) {
                fs_1.default.rmdirSync(dirPath)
                // Recursively check parent directory
                this.cleanEmptyLocalFolders(node_path_1.default.dirname(dirPath))
            }
        } catch (error) {
            // Ignore errors during cleanup
            console.error('Error cleaning empty folders:', error)
        }
    }
    async removeFilesFromStorage(...paths) {
        const directory = this.buildPath(...paths.map((p) => this.sanitizeFilename(p)))
        await this.deleteLocalFolderRecursive(directory)
        const totalSize = await this.getStorageSize(paths[0])
        return { totalSize: totalSize / 1024 / 1024 }
    }
    async removeSpecificFileFromUpload(filePath) {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath)
        }
    }
    async removeSpecificFileFromStorage(...paths) {
        const fileName = paths.pop()
        if (fileName) {
            const sanitizedFilename = this.sanitizeFilename(fileName)
            paths.push(sanitizedFilename)
        }
        const file = this.buildPath(...paths.map((p) => this.sanitizeFilename(p)))
        // check if file exists, if not skip delete
        const stat = fs_1.default.statSync(file, { throwIfNoEntry: false })
        if (stat && stat.isFile()) {
            fs_1.default.unlinkSync(file)
        }
        const totalSize = await this.getStorageSize(paths[0])
        return { totalSize: totalSize / 1024 / 1024 }
    }
    async removeFolderFromStorage(...paths) {
        const directory = this.buildPath(...paths.map((p) => this.sanitizeFilename(p)))
        await this.deleteLocalFolderRecursive(directory, true)
        const totalSize = await this.getStorageSize(paths[0])
        return { totalSize: totalSize / 1024 / 1024 }
    }
    async deleteLocalFolderRecursive(directory, deleteParentChatflowFolder) {
        try {
            // Check if the path exists
            await fs_1.default.promises.access(directory)
            if (deleteParentChatflowFolder) {
                await fs_1.default.promises.rm(directory, { recursive: true })
                return
            }
            // Get stats of the path to determine if it's a file or directory
            const stats = await fs_1.default.promises.stat(directory)
            if (stats.isDirectory()) {
                // Read all directory contents
                const files = await fs_1.default.promises.readdir(directory)
                // Recursively delete all contents
                for (const file of files) {
                    const currentPath = node_path_1.default.join(directory, file)
                    await this.deleteLocalFolderRecursive(currentPath)
                }
                // Delete the directory itself after emptying it
                await fs_1.default.promises.rm(directory, { recursive: true })
            } else {
                // If it's a file, delete it directly
                await fs_1.default.promises.unlink(directory)
            }
        } catch (error) {
            // Error handling - ignore if file/directory doesn't exist
        }
    }
    async getStorageSize(orgId) {
        if (!orgId) return 0
        const directory = this.buildPath(orgId)
        return this.dirSize(directory)
    }
    async dirSize(directoryPath) {
        let totalSize = 0
        const calculateSize = async (itemPath) => {
            try {
                const stats = await fs_1.default.promises.stat(itemPath)
                if (stats.isFile()) {
                    totalSize += stats.size
                } else if (stats.isDirectory()) {
                    const files = await fs_1.default.promises.readdir(itemPath)
                    for (const file of files) {
                        await calculateSize(node_path_1.default.join(itemPath, file))
                    }
                }
            } catch (error) {
                // Ignore missing files/dirs during calculation
            }
        }
        await calculateSize(directoryPath)
        return totalSize
    }
    getMulterStorage() {
        const uploadPath = this.getUploadPath()
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true })
        }
        return (0, multer_1.default)({ dest: uploadPath })
    }
    getUploadPath() {
        return process.env.BLOB_STORAGE_PATH
            ? node_path_1.default.join(process.env.BLOB_STORAGE_PATH, 'uploads')
            : node_path_1.default.join(this.getUserHome(), '.flowise', 'uploads')
    }
    getUserHome() {
        return process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH || ''
    }
    getLoggerTransports(logType, config) {
        const logDir = config?.logging?.dir || node_path_1.default.join(this.getUserHome(), '.flowise', 'logs')
        if (!fs_1.default.existsSync(logDir)) {
            fs_1.default.mkdirSync(logDir, { recursive: true })
        }
        if (logType === 'server') {
            return [
                new winston_daily_rotate_file_1.default({
                    filename: node_path_1.default.join(logDir, config?.logging?.server?.filename ?? 'server-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD-HH',
                    maxSize: '20m',
                    level: config?.logging?.server?.level ?? 'info'
                })
            ]
        } else if (logType === 'requests') {
            return [
                new winston_1.transports.File({
                    filename: node_path_1.default.join(logDir, config?.logging?.express?.filename ?? 'server-requests.log.jsonl'),
                    level: config?.logging?.express?.level ?? 'debug'
                })
            ]
        } else if (logType === 'audit') {
            return [
                new winston_daily_rotate_file_1.default({
                    filename: node_path_1.default.join(logDir, 'audit-%DATE%.log.jsonl'),
                    datePattern: 'YYYY-MM-DD-HH',
                    maxSize: '20m',
                    level: 'info'
                })
            ]
        }
        // For 'error' type, return empty array (handled by exceptionHandlers in logger.ts)
        return []
    }
}
exports.LocalStorageProvider = LocalStorageProvider
//# sourceMappingURL=LocalStorageProvider.js.map
