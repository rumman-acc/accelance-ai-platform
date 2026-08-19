"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const documents_1 = require("@langchain/core/documents");
const src_1 = require("../../../src");
class DocStore_DocumentLoaders {
    constructor() {
        //@ts-ignore
        this.loadMethods = {
            async listStores(_, options) {
                const returnData = [];
                const appDataSource = options.appDataSource;
                const databaseEntities = options.databaseEntities;
                if (appDataSource === undefined || !appDataSource) {
                    return returnData;
                }
                const searchOptions = options.searchOptions || {};
                const stores = await appDataSource.getRepository(databaseEntities['DocumentStore']).findBy(searchOptions);
                for (const store of stores) {
                    if (store.status === 'SYNC') {
                        const obj = {
                            name: store.id,
                            label: store.name,
                            description: store.description
                        };
                        returnData.push(obj);
                    }
                }
                return returnData;
            }
        };
        this.label = 'Document Store';
        this.name = 'documentStore';
        this.version = 1.0;
        this.type = 'Document';
        this.icon = 'dstore.svg';
        this.category = 'Document Loaders';
        this.description = `Load data from pre-configured document stores`;
        this.baseClasses = [this.type];
        this.inputs = [
            {
                label: 'Select Store',
                name: 'selectedStore',
                type: 'asyncOptions',
                loadMethod: 'listStores'
            }
        ];
        this.outputs = [
            {
                label: 'Document',
                name: 'document',
                description: 'Array of document objects containing metadata and pageContent',
                baseClasses: [...this.baseClasses, 'json']
            },
            {
                label: 'Text',
                name: 'text',
                description: 'Concatenated string from pageContent of documents',
                baseClasses: ['string', 'json']
            }
        ];
    }
    async init(nodeData, _, options) {
        const selectedStore = nodeData.inputs?.selectedStore;
        const appDataSource = options.appDataSource;
        const databaseEntities = options.databaseEntities;
        const chunks = await appDataSource
            .getRepository(databaseEntities['DocumentStoreFileChunk'])
            .find({ where: { storeId: selectedStore } });
        const output = nodeData.outputs?.output;
        const finalDocs = [];
        for (const chunk of chunks) {
            finalDocs.push(new documents_1.Document({ pageContent: chunk.pageContent, metadata: JSON.parse(chunk.metadata) }));
        }
        if (output === 'document') {
            return finalDocs;
        }
        else {
            let finaltext = '';
            for (const doc of finalDocs) {
                finaltext += `${doc.pageContent}\n`;
            }
            return (0, src_1.handleEscapeCharacters)(finaltext, false);
        }
    }
}
module.exports = { nodeClass: DocStore_DocumentLoaders };
//# sourceMappingURL=DocStoreLoader.js.map