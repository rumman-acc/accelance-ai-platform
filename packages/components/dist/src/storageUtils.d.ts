import fs from 'fs';
import { StorageResult, StorageSizeResult, FileInfo } from './storage';
export declare const addBase64FilesToStorage: (fileBase64: string, chatflowid: string, fileNames: string[], orgId: string) => Promise<StorageResult>;
export declare const addArrayFilesToStorage: (mime: string, bf: Buffer, fileName: string, fileNames: string[], ...paths: string[]) => Promise<StorageResult>;
export declare const addSingleFileToStorage: (mime: string, bf: Buffer, fileName: string, ...paths: string[]) => Promise<StorageResult>;
export declare const getFileFromUpload: (filePath: string) => Promise<Buffer>;
export declare const getFileFromStorage: (file: string, ...paths: string[]) => Promise<Buffer>;
export declare const getFilesListFromStorage: (...paths: string[]) => Promise<FileInfo[]>;
/**
 * Prepare storage path
 */
export declare const getStoragePath: () => string;
/**
 * Path to the locally-cached, periodically-refreshed model list (see refreshModelList job in
 * packages/server). Independent of getStoragePath() since it's server-local metadata, not
 * user-uploaded content, and must exist regardless of STORAGE_TYPE (local vs cloud).
 */
export declare const getModelsCachePath: () => string;
/**
 * Get the storage type - local or cloud
 */
export declare const getStorageType: () => string;
export declare const removeFilesFromStorage: (...paths: string[]) => Promise<StorageSizeResult>;
export declare const removeSpecificFileFromUpload: (filePath: string) => Promise<void>;
export declare const removeSpecificFileFromStorage: (...paths: string[]) => Promise<StorageSizeResult>;
export declare const removeFolderFromStorage: (...paths: string[]) => Promise<StorageSizeResult>;
export declare const streamStorageFile: (chatflowId: string, chatId: string, fileName: string, orgId: string) => Promise<fs.ReadStream | Buffer | undefined>;
/**
 * Get the total storage size for an organization (unified across all providers)
 */
export declare const getStorageSize: (orgId: string) => Promise<number>;
