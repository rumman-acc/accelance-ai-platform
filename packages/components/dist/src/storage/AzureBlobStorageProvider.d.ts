import multer from 'multer'
import { BaseStorageProvider } from './BaseStorageProvider'
import { FileInfo, StorageResult, StorageSizeResult } from './IStorageProvider'
export declare class AzureBlobStorageProvider extends BaseStorageProvider {
    private containerClient
    private containerName
    constructor()
    private initAzureConfig
    getStorageType(): string
    getConfig(): any
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
    getStorageSize(orgId: string): Promise<number>
    getMulterStorage(): multer.Multer
    getLoggerTransports(logType: 'server' | 'error' | 'requests' | 'audit'): any[]
}
