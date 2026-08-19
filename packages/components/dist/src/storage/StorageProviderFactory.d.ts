import { IStorageProvider } from './IStorageProvider'
/**
 * Factory for creating and managing storage provider instances.
 * Uses singleton pattern to ensure only one provider instance exists.
 */
export declare class StorageProviderFactory {
    private static instance
    /**
     * Get the storage provider instance based on STORAGE_TYPE environment variable.
     * Creates a new instance if one doesn't exist.
     */
    static getProvider(): IStorageProvider
}
