"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageProviderFactory = void 0;
const LocalStorageProvider_1 = require("./LocalStorageProvider");
const S3StorageProvider_1 = require("./S3StorageProvider");
const GCSStorageProvider_1 = require("./GCSStorageProvider");
const AzureBlobStorageProvider_1 = require("./AzureBlobStorageProvider");
const ImageKitStorageProvider_1 = require("./ImageKitStorageProvider");
/**
 * Factory for creating and managing storage provider instances.
 * Uses singleton pattern to ensure only one provider instance exists.
 */
class StorageProviderFactory {
    /**
     * Get the storage provider instance based on STORAGE_TYPE environment variable.
     * Creates a new instance if one doesn't exist.
     */
    static getProvider() {
        if (!StorageProviderFactory.instance) {
            const storageType = process.env.STORAGE_TYPE || 'local';
            switch (storageType) {
                case 's3':
                    StorageProviderFactory.instance = new S3StorageProvider_1.S3StorageProvider();
                    break;
                case 'gcs':
                    StorageProviderFactory.instance = new GCSStorageProvider_1.GCSStorageProvider();
                    break;
                case 'azure':
                    StorageProviderFactory.instance = new AzureBlobStorageProvider_1.AzureBlobStorageProvider();
                    break;
                case 'imagekit':
                    StorageProviderFactory.instance = new ImageKitStorageProvider_1.ImageKitStorageProvider();
                    break;
                case 'local':
                default:
                    StorageProviderFactory.instance = new LocalStorageProvider_1.LocalStorageProvider();
                    break;
            }
        }
        return StorageProviderFactory.instance;
    }
}
exports.StorageProviderFactory = StorageProviderFactory;
StorageProviderFactory.instance = null;
//# sourceMappingURL=StorageProviderFactory.js.map