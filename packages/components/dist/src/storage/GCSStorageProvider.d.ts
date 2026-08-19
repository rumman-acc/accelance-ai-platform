import multer from 'multer'
import { BaseStorageProvider } from './BaseStorageProvider'
import { FileInfo, StorageResult, StorageSizeResult } from './IStorageProvider'
export declare class GCSStorageProvider extends BaseStorageProvider {
    private bucket
    private bucketName
    private projectId
    private keyFilename
    constructor()
    private initGCSConfig
    getStorageType(): string
    getConfig(): any
    private normalizePath
    addBase64FilesToStorage(fileBase64: string, chatflowid: string, fileNames: string[], orgId: string): Promise<StorageResult>
    addArrayFilesToStorage(mime: string, bf: Buffer, fileName: string, fileNames: string[], ...paths: string[]): Promise<StorageResult>
    addSingleFileToStorage(mime: string, bf: Buffer, fileName: string, ...paths: string[]): Promise<StorageResult>
    getFileFromUpload(filePath: string): Promise<Buffer>
    getFileFromStorage(file: string, ...paths: string[]): Promise<Buffer>
    streamStorageFile(chatflowId: string, chatId: string, fileName: string, orgId: string): Promise<Buffer | undefined>
    getFilesListFromStorage(...paths: string[]): Promise<FileInfo[]>
    removeFilesFromStorage(...paths: string[]): Promise<StorageSizeResult>
    removeSpecificFileFromUpload(filePath: string): Promise<void>
    removeSpecificFileFromStorage(...paths: string[]): Promise<StorageSizeResult>
    removeFolderFromStorage(...paths: string[]): Promise<StorageSizeResult>
    private cleanEmptyGCSFolders
    getStorageSize(orgId: string): Promise<number>
    getMulterStorage(): multer.Multer
    getLoggerTransports(logType: 'server' | 'error' | 'requests' | 'audit'): any[]
}
