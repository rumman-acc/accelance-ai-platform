"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
class DocStore_VectorStores {
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
                    if (store.status === 'UPSERTED') {
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
        this.label = 'Document Store (Vector)';
        this.name = 'documentStoreVS';
        this.version = 1.0;
        this.type = 'DocumentStoreVS';
        this.icon = 'dstore.svg';
        this.category = 'Vector Stores';
        this.description = `Search and retrieve documents from Document Store`;
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
                label: 'Retriever',
                name: 'retriever',
                baseClasses: ['BaseRetriever']
            },
            {
                label: 'Vector Store',
                name: 'vectorStore',
                baseClasses: ['VectorStore']
            }
        ];
    }
    async init(nodeData, _, options) {
        const selectedStore = nodeData.inputs?.selectedStore;
        const appDataSource = options.appDataSource;
        const databaseEntities = options.databaseEntities;
        const output = nodeData.outputs?.output;
        const entity = await appDataSource.getRepository(databaseEntities['DocumentStore']).findOneBy({ id: selectedStore });
        if (!entity) {
            return { error: 'Store not found' };
        }
        const data = {};
        data.output = output;
        // Prepare Embeddings Instance
        const embeddingConfig = JSON.parse(entity.embeddingConfig);
        data.embeddingName = embeddingConfig.name;
        data.embeddingConfig = embeddingConfig.config;
        let embeddingObj = await _createEmbeddingsObject(options.componentNodes, data, options);
        if (!embeddingObj) {
            return { error: 'Failed to create EmbeddingObj' };
        }
        // Prepare Vector Store Instance
        const vsConfig = JSON.parse(entity.vectorStoreConfig);
        data.vectorStoreName = vsConfig.name;
        data.vectorStoreConfig = vsConfig.config;
        if (data.inputs) {
            data.vectorStoreConfig = { ...vsConfig.config, ...data.inputs };
        }
        // Prepare Vector Store Node Data
        const vStoreNodeData = _createVectorStoreNodeData(options.componentNodes, data, embeddingObj);
        // Finally create the Vector Store or Retriever object (data.output)
        const vectorStoreObj = await _createVectorStoreObject(options.componentNodes, data);
        const retrieverOrVectorStore = await vectorStoreObj.init(vStoreNodeData, '', options);
        if (!retrieverOrVectorStore) {
            return { error: 'Failed to create vectorStore' };
        }
        return retrieverOrVectorStore;
    }
}
const _createEmbeddingsObject = async (componentNodes, data, options) => {
    // prepare embedding node data
    const embeddingComponent = componentNodes[data.embeddingName];
    const embeddingNodeData = {
        inputs: { ...data.embeddingConfig },
        outputs: { output: 'document' },
        id: `${embeddingComponent.name}_0`,
        label: embeddingComponent.label,
        name: embeddingComponent.name,
        category: embeddingComponent.category,
        inputParams: embeddingComponent.inputs || []
    };
    if (data.embeddingConfig.credential) {
        embeddingNodeData.credential = data.embeddingConfig.credential;
    }
    // init embedding object
    const embeddingNodeInstanceFilePath = embeddingComponent.filePath;
    const embeddingNodeModule = await Promise.resolve(`${embeddingNodeInstanceFilePath}`).then(s => __importStar(require(s)));
    const embeddingNodeInstance = new embeddingNodeModule.nodeClass();
    return await embeddingNodeInstance.init(embeddingNodeData, '', options);
};
const _createVectorStoreNodeData = (componentNodes, data, embeddingObj) => {
    const vectorStoreComponent = componentNodes[data.vectorStoreName];
    const vStoreNodeData = {
        id: `${vectorStoreComponent.name}_0`,
        inputs: { ...data.vectorStoreConfig },
        outputs: { output: data.output },
        label: vectorStoreComponent.label,
        name: vectorStoreComponent.name,
        category: vectorStoreComponent.category
    };
    if (data.vectorStoreConfig.credential) {
        vStoreNodeData.credential = data.vectorStoreConfig.credential;
    }
    if (embeddingObj) {
        vStoreNodeData.inputs.embeddings = embeddingObj;
    }
    // Get all input params except the ones that are anchor points to avoid JSON stringify circular error
    const filterInputParams = ['document', 'embeddings', 'recordManager'];
    const inputParams = vectorStoreComponent.inputs?.filter((input) => !filterInputParams.includes(input.name));
    vStoreNodeData.inputParams = inputParams;
    return vStoreNodeData;
};
const _createVectorStoreObject = async (componentNodes, data) => {
    const vStoreNodeInstanceFilePath = componentNodes[data.vectorStoreName].filePath;
    const vStoreNodeModule = await Promise.resolve(`${vStoreNodeInstanceFilePath}`).then(s => __importStar(require(s)));
    const vStoreNodeInstance = new vStoreNodeModule.nodeClass();
    return vStoreNodeInstance;
};
module.exports = { nodeClass: DocStore_VectorStores };
//# sourceMappingURL=DocStoreVector.js.map