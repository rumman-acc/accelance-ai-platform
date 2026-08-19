import fs from 'node:fs'
import { FileInfo, IStorageProvider, StorageResult, StorageSizeResult } from './IStorageProvider'
export declare abstract class BaseStorageProvider implements IStorageProvider {
    protected storagePath: string
    constructor()
    abstract getStorageType(): string
    abstract getConfig(): any
    abstract addBase64FilesToStorage(fileBase64: string, chatflowid: string, fileNames: string[], orgId: string): Promise<StorageResult>
    abstract addArrayFilesToStorage(
        mime: string,
        bf: Buffer,
        fileName: string,
        fileNames: string[],
        ...paths: string[]
    ): Promise<StorageResult>
    abstract addSingleFileToStorage(mime: string, bf: Buffer, fileName: string, ...paths: string[]): Promise<StorageResult>
    abstract getFileFromUpload(filePath: string): Promise<Buffer>
    abstract getFileFromStorage(file: string, ...paths: string[]): Promise<Buffer>
    abstract getFilesListFromStorage(...paths: string[]): Promise<FileInfo[]>
    abstract streamStorageFile(
        chatflowId: string,
        chatId: string,
        fileName: string,
        orgId: string
    ): Promise<fs.ReadStream | Buffer | undefined>
    abstract removeFilesFromStorage(...paths: string[]): Promise<StorageSizeResult>
    abstract removeSpecificFileFromUpload(filePath: string): Promise<void>
    abstract removeSpecificFileFromStorage(...paths: string[]): Promise<StorageSizeResult>
    abstract removeFolderFromStorage(...paths: string[]): Promise<StorageSizeResult>
    abstract getStorageSize(orgId: string): Promise<number>
    abstract getMulterStorage(): any
    abstract getLoggerTransports(logType: 'server' | 'error' | 'requests' | 'audit', config?: any): any[]
    /**
     * Shared utility for sanitizing filenames to prevent path traversal and other issues
     */
    protected sanitizeFilename(filename: string): string
    /**
     * Shared utility for getting the base storage path
     */
    protected getStoragePath(): string
    /**
     * Shared utility for validating chatflowId format (UUID)
     */
    protected validateChatflowId(chatflowId: string): void
    /**
     * Shared utility for checking path traversal attempts
     */
    protected validatePathSecurity(...paths: string[]): void
    /**
     * Shared utility for building a storage path from components
     */
    protected buildPath(...paths: string[]): string
}
