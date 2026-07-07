import axios from 'axios'
import ImageKit from 'imagekit'
import multer from 'multer'
import TransportStream from 'winston-transport'
import { v4 as uuidv4 } from 'uuid'
import { BaseStorageProvider } from './BaseStorageProvider'
import { FileInfo, StorageResult, StorageSizeResult } from './IStorageProvider'

/**
 * Multer storage engine backed by ImageKit. No official multer-imagekit package exists,
 * so this hand-rolls the engine contract (_handleFile/_removeFile) that multer duck-types.
 */
class ImageKitMulterStorage {
    constructor(private imagekit: ImageKit) {}

    _handleFile(_req: any, file: any, cb: (error?: any, info?: any) => void): void {
        const chunks: Buffer[] = []
        // Buffer the full upload in memory - ImageKit's SDK does not accept a raw stream for 'file'
        file.stream.on('data', (chunk: Buffer) => chunks.push(chunk))
        file.stream.on('error', (err: any) => cb(err))
        file.stream.on('end', () => {
            const buffer = Buffer.concat(chunks)
            this.imagekit
                .upload({
                    file: buffer,
                    fileName: file.originalname,
                    folder: `/uploads/${uuidv4()}`,
                    useUniqueFileName: false,
                    overwriteFile: true
                })
                .then((result: any) => {
                    // Store the ImageKit fileId in file.path - getFileFromUpload/removeSpecificFileFromUpload
                    // key off this value for the ephemeral multer-upload flow
                    cb(null, { path: result.fileId, size: buffer.length, filename: file.originalname })
                })
                .catch((err: any) => cb(err))
        })
    }

    _removeFile(_req: any, file: any, cb: (error: Error | null) => void): void {
        this.imagekit
            .deleteFile(file.path)
            .then(() => cb(null))
            .catch((err: any) => cb(err))
    }
}

/**
 * Minimal Winston transport for ImageKit. ImageKit has no logging product, so this
 * buffers log lines and periodically uploads them as a single dated file per log type -
 * best-effort, not a critical-path guarantee (unlike GCS/Azure's real logging integrations).
 */
class ImageKitLogTransport extends TransportStream {
    private buffer: string[] = []
    private flushTimer: NodeJS.Timeout

    constructor(private imagekit: ImageKit, private logType: string, opts: any) {
        super(opts)
        this.flushTimer = setInterval(() => this.flush(), 30_000)
        this.flushTimer.unref()
    }

    log(info: any, callback: () => void): void {
        setImmediate(() => this.emit('logged', info))
        this.buffer.push(`${info.timestamp ?? new Date().toISOString()} [${info.level}] ${info.message}`)
        callback()
    }

    private flush(): void {
        if (this.buffer.length === 0) return
        const lines = this.buffer.splice(0, this.buffer.length)
        this.imagekit
            .upload({
                file: Buffer.from(lines.join('\n'), 'utf-8'),
                fileName: `${Date.now()}.log`,
                folder: `/logs/${this.logType}`,
                useUniqueFileName: false,
                overwriteFile: true
            })
            .catch((err: any) => {
                console.error(`Error logging to ImageKit (${this.logType}):`, err)
            })
    }
}

export class ImageKitStorageProvider extends BaseStorageProvider {
    private imagekit: ImageKit
    private urlEndpoint: string

    constructor() {
        super()
        const config = this.initImageKitConfig()
        this.imagekit = config.imagekit
        this.urlEndpoint = config.urlEndpoint
    }

    private initImageKitConfig(): { imagekit: ImageKit; urlEndpoint: string } {
        const publicKey = process.env.IMAGEKIT_PUBLIC_KEY
        const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
        const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT

        if (!publicKey || !privateKey || !urlEndpoint) {
            throw new Error('IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT env variables are required')
        }

        const imagekit = new ImageKit({ publicKey, privateKey, urlEndpoint })
        return { imagekit, urlEndpoint: urlEndpoint.replace(/\/+$/, '') }
    }

    getStorageType(): string {
        return 'imagekit'
    }

    getConfig(): any {
        return { urlEndpoint: this.urlEndpoint }
    }

    private normalizeSegment(p: string): string {
        return p.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '')
    }

    private buildFolderPath(...paths: string[]): string {
        return (
            '/' +
            paths
                .map((p) => this.normalizeSegment(p))
                .filter(Boolean)
                .join('/')
        )
    }

    private async downloadByUrl(url: string): Promise<Buffer> {
        const response = await axios.get(url, { responseType: 'arraybuffer' })
        return Buffer.from(response.data)
    }

    private async listAllFiles(folder: string): Promise<any[]> {
        const results: any[] = []
        const limit = 1000
        let skip = 0
        for (;;) {
            const page: any[] = await this.imagekit.listFiles({ path: folder, limit, skip })
            results.push(...page)
            if (page.length < limit) break
            skip += limit
        }
        return results
    }

    async addBase64FilesToStorage(fileBase64: string, chatflowid: string, fileNames: string[], orgId: string): Promise<StorageResult> {
        this.validateChatflowId(chatflowid)
        this.validatePathSecurity(chatflowid)

        const splitDataURI = fileBase64.split(',')
        const filename = splitDataURI.pop()?.split(':')[1] ?? ''
        const bf = Buffer.from(splitDataURI.pop() || '', 'base64')

        const sanitizedFilename = this.sanitizeFilename(filename)
        const folder = this.buildFolderPath(orgId, chatflowid)

        await this.imagekit.upload({
            file: bf,
            fileName: sanitizedFilename,
            folder,
            useUniqueFileName: false,
            overwriteFile: true
        })

        fileNames.push(sanitizedFilename)
        const totalSize = await this.getStorageSize(orgId)

        return { path: 'FILE-STORAGE::' + JSON.stringify(fileNames), totalSize: totalSize / 1024 / 1024 }
    }

    async addArrayFilesToStorage(
        mime: string,
        bf: Buffer,
        fileName: string,
        fileNames: string[],
        ...paths: string[]
    ): Promise<StorageResult> {
        const sanitizedFilename = this.sanitizeFilename(fileName)
        const folder = this.buildFolderPath(...paths)

        await this.imagekit.upload({
            file: bf,
            fileName: sanitizedFilename,
            folder,
            useUniqueFileName: false,
            overwriteFile: true
        })

        fileNames.push(sanitizedFilename)
        const totalSize = await this.getStorageSize(paths[0])

        return { path: 'FILE-STORAGE::' + JSON.stringify(fileNames), totalSize: totalSize / 1024 / 1024 }
    }

    async addSingleFileToStorage(mime: string, bf: Buffer, fileName: string, ...paths: string[]): Promise<StorageResult> {
        const sanitizedFilename = this.sanitizeFilename(fileName)
        const folder = this.buildFolderPath(...paths)

        await this.imagekit.upload({
            file: bf,
            fileName: sanitizedFilename,
            folder,
            useUniqueFileName: false,
            overwriteFile: true
        })

        const totalSize = await this.getStorageSize(paths[0])
        return { path: 'FILE-STORAGE::' + sanitizedFilename, totalSize: totalSize / 1024 / 1024 }
    }

    async getFileFromUpload(filePath: string): Promise<Buffer> {
        // filePath is the ImageKit fileId set by ImageKitMulterStorage, not a folder path
        const details: any = await this.imagekit.getFileDetails(filePath)
        return this.downloadByUrl(details.url)
    }

    async getFileFromStorage(file: string, ...paths: string[]): Promise<Buffer> {
        const sanitizedFilename = this.sanitizeFilename(file)
        const folder = this.buildFolderPath(...paths)
        return this.downloadByUrl(`${this.urlEndpoint}${folder}/${sanitizedFilename}`)
    }

    async streamStorageFile(chatflowId: string, chatId: string, fileName: string, orgId: string): Promise<Buffer | undefined> {
        this.validateChatflowId(chatflowId)
        this.validatePathSecurity(chatflowId, chatId)

        const sanitizedFilename = this.sanitizeFilename(fileName)
        const folder = this.buildFolderPath(orgId, chatflowId, chatId)

        try {
            return await this.downloadByUrl(`${this.urlEndpoint}${folder}/${sanitizedFilename}`)
        } catch (error) {
            throw new Error(`File ${fileName} not found`)
        }
    }

    async getFilesListFromStorage(...paths: string[]): Promise<FileInfo[]> {
        const folder = this.buildFolderPath(...paths)
        const files = await this.listAllFiles(folder)

        return files
            .filter((f) => f.type === 'file')
            .map((f) => ({
                name: f.name,
                path: `${folder}/${f.name}`,
                size: f.size || 0
            }))
    }

    async removeFilesFromStorage(...paths: string[]): Promise<StorageSizeResult> {
        const folder = this.buildFolderPath(...paths)
        try {
            await this.imagekit.deleteFolder(folder)
        } catch (error) {
            // Folder may not exist - ignore
        }

        const totalSize = await this.getStorageSize(paths[0])
        return { totalSize: totalSize / 1024 / 1024 }
    }

    async removeSpecificFileFromUpload(filePath: string): Promise<void> {
        // filePath is the ImageKit fileId set by ImageKitMulterStorage, not a folder path
        await this.imagekit.deleteFile(filePath)
    }

    async removeSpecificFileFromStorage(...paths: string[]): Promise<StorageSizeResult> {
        const fileName = paths.pop()
        const sanitizedFilename = fileName ? this.sanitizeFilename(fileName) : ''
        const folder = this.buildFolderPath(...paths)

        // ImageKit has no delete-by-path API for a single file - look up its fileId first
        const files = await this.listAllFiles(folder)
        const match = files.find((f) => f.name === sanitizedFilename)
        if (match) {
            await this.imagekit.deleteFile(match.fileId)
        }

        const totalSize = await this.getStorageSize(paths[0])
        return { totalSize: totalSize / 1024 / 1024 }
    }

    async removeFolderFromStorage(...paths: string[]): Promise<StorageSizeResult> {
        const folder = this.buildFolderPath(...paths)
        try {
            await this.imagekit.deleteFolder(folder)
        } catch (error) {
            // Folder may not exist - ignore
        }

        const totalSize = await this.getStorageSize(paths[0])
        return { totalSize: totalSize / 1024 / 1024 }
    }

    async getStorageSize(orgId: string): Promise<number> {
        if (!orgId) return 0

        const folder = this.buildFolderPath(orgId)
        const files = await this.listAllFiles(folder)

        return files.reduce((total, f) => total + (f.size || 0), 0)
    }

    getMulterStorage(): multer.Multer {
        return multer({ storage: new ImageKitMulterStorage(this.imagekit) as unknown as multer.StorageEngine })
    }

    getLoggerTransports(logType: 'server' | 'error' | 'requests' | 'audit'): any[] {
        const level = logType === 'error' ? 'error' : logType === 'requests' || logType === 'audit' ? 'debug' : 'info'
        return [new ImageKitLogTransport(this.imagekit, logType, { level })]
    }
}
