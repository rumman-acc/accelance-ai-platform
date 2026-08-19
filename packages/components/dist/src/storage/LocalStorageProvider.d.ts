import fs from 'fs'
import multer from 'multer'
import { BaseStorageProvider } from './BaseStorageProvider'
import { FileInfo, StorageResult, StorageSizeResult } from './IStorageProvider'
export declare class LocalStorageProvider extends BaseStorageProvider {
    constructor()
    getStorageType(): string
    getConfig(): any
    addBase64FilesToStorage(fileBase64: string, chatflowid: string, fileNames: string[], orgId: string): Promise<StorageResult>
    addArrayFilesToStorage(mime: string, bf: Buffer, fileName: string, fileNames: string[], ...paths: string[]): Promise<StorageResult>
    addSingleFileToStorage(mime: string, bf: Buffer, fileName: string, ...paths: string[]): Promise<StorageResult>
    getFileFromUpload(filePath: string): Promise<Buffer>
    getFileFromStorage(file: string, ...paths: string[]): Promise<Buffer>
    streamStorageFile(chatflowId: string, chatId: string, fileName: string, orgId: string): Promise<fs.ReadStream | Buffer | undefined>
    getFilesListFromStorage(...paths: string[]): Promise<FileInfo[]>
    private getFilePaths
    private cleanEmptyLocalFolders
    removeFilesFromStorage(...paths: string[]): Promise<StorageSizeResult>
    removeSpecificFileFromUpload(filePath: string): Promise<void>
    removeSpecificFileFromStorage(...paths: string[]): Promise<StorageSizeResult>
    removeFolderFromStorage(...paths: string[]): Promise<StorageSizeResult>
    private deleteLocalFolderRecursive
    getStorageSize(orgId: string): Promise<number>
    private dirSize
    getMulterStorage(): multer.Multer
    private getUploadPath
    private getUserHome
    getLoggerTransports(logType: 'server' | 'error' | 'requests' | 'audit', config?: any): any[]
}
