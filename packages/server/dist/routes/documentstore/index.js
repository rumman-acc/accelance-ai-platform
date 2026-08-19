"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const PermissionCheck_1 = require("../../enterprise/rbac/PermissionCheck");
const documentstore_1 = __importDefault(require("../../controllers/documentstore"));
const utils_1 = require("../../utils");
const router = express_1.default.Router();
router.post(['/upsert/', '/upsert/:id'], (0, utils_1.getMulterStorage)().array('files'), documentstore_1.default.upsertDocStoreMiddleware);
router.post(['/refresh/', '/refresh/:id'], documentstore_1.default.refreshDocStoreMiddleware);
/** Document Store Routes */
// Create document store
router.post('/store', (0, PermissionCheck_1.checkPermission)('documentStores:create'), documentstore_1.default.createDocumentStore);
// List all stores
router.get('/store', (0, PermissionCheck_1.checkPermission)('documentStores:view'), documentstore_1.default.getAllDocumentStores);
// Get specific store
router.get('/store/:id', (0, PermissionCheck_1.checkAnyPermission)('documentStores:view,documentStores:update,documentStores:delete'), documentstore_1.default.getDocumentStoreById);
// Update documentStore
router.put('/store/:id', (0, PermissionCheck_1.checkAnyPermission)('documentStores:create,documentStores:update'), documentstore_1.default.updateDocumentStore);
// Delete documentStore
router.delete('/store/:id', (0, PermissionCheck_1.checkPermission)('documentStores:delete'), documentstore_1.default.deleteDocumentStore);
// Get document store configs
router.get('/store-configs/:id/:loaderId', (0, PermissionCheck_1.checkAnyPermission)('documentStores:view'), documentstore_1.default.getDocStoreConfigs);
/** Component Nodes = Document Store - Loaders */
// Get all loaders
router.get('/components/loaders', (0, PermissionCheck_1.checkPermission)('documentStores:add-loader'), documentstore_1.default.getDocumentLoaders);
// delete loader from document store
router.delete('/loader/:id/:loaderId', (0, PermissionCheck_1.checkPermission)('documentStores:delete-loader'), documentstore_1.default.deleteLoaderFromDocumentStore);
// chunking preview
router.post('/loader/preview', (0, PermissionCheck_1.checkPermission)('documentStores:preview-process'), documentstore_1.default.previewFileChunks);
// saving process
router.post('/loader/save', (0, PermissionCheck_1.checkPermission)('documentStores:preview-process'), documentstore_1.default.saveProcessingLoader);
// chunking process
router.post('/loader/process/:loaderId', (0, PermissionCheck_1.checkPermission)('documentStores:preview-process'), documentstore_1.default.processLoader);
/** Document Store - Loaders - Chunks */
// delete specific file chunk from the store
router.delete('/chunks/:storeId/:loaderId/:chunkId', (0, PermissionCheck_1.checkAnyPermission)('documentStores:update,documentStores:delete'), documentstore_1.default.deleteDocumentStoreFileChunk);
// edit specific file chunk from the store
router.put('/chunks/:storeId/:loaderId/:chunkId', (0, PermissionCheck_1.checkPermission)('documentStores:update'), documentstore_1.default.editDocumentStoreFileChunk);
// Get all file chunks from the store
router.get('/chunks/:storeId/:fileId/:pageNo', (0, PermissionCheck_1.checkPermission)('documentStores:view'), documentstore_1.default.getDocumentStoreFileChunks);
// add chunks to the selected vector store
router.post('/vectorstore/insert', (0, PermissionCheck_1.checkPermission)('documentStores:upsert-config'), documentstore_1.default.insertIntoVectorStore);
// save the selected vector store
router.post('/vectorstore/save', (0, PermissionCheck_1.checkPermission)('documentStores:upsert-config'), documentstore_1.default.saveVectorStoreConfig);
// delete data from the selected vector store
router.delete('/vectorstore/:storeId', (0, PermissionCheck_1.checkPermission)('documentStores:upsert-config'), documentstore_1.default.deleteVectorStoreFromStore);
// query the vector store
router.post('/vectorstore/query', (0, PermissionCheck_1.checkPermission)('documentStores:view'), documentstore_1.default.queryVectorStore);
// Get all embedding providers
router.get('/components/embeddings', (0, PermissionCheck_1.checkPermission)('documentStores:upsert-config'), documentstore_1.default.getEmbeddingProviders);
// Get all vector store providers
router.get('/components/vectorstore', (0, PermissionCheck_1.checkPermission)('documentStores:upsert-config'), documentstore_1.default.getVectorStoreProviders);
// Get all Record Manager providers
router.get('/components/recordmanager', (0, PermissionCheck_1.checkPermission)('documentStores:upsert-config'), documentstore_1.default.getRecordManagerProviders);
// update the selected vector store from the playground
router.post('/vectorstore/update', (0, PermissionCheck_1.checkPermission)('documentStores:upsert-config'), documentstore_1.default.updateVectorStoreConfigOnly);
// generate docstore tool description
router.post('/generate-tool-desc/:id', (0, PermissionCheck_1.checkPermission)('documentStores:view'), documentstore_1.default.generateDocStoreToolDesc);
exports.default = router;
//# sourceMappingURL=index.js.map