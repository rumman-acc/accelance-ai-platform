"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDocumentStoreFromByteStore = createDocumentStoreFromByteStore;
const ioredis_1 = require("ioredis");
const ioredis_2 = require("@langchain/community/storage/ioredis");
const embeddings_1 = require("@langchain/core/embeddings");
const src_1 = require("../../../src");
const stores_1 = require("@langchain/core/stores");
const hash_1 = require("@langchain/core/utils/hash");
const documents_1 = require("@langchain/core/documents");
class RedisEmbeddingsCache {
    constructor() {
        this.label = 'Redis Embeddings Cache';
        this.name = 'redisEmbeddingsCache';
        this.version = 1.0;
        this.type = 'RedisEmbeddingsCache';
        this.description = 'Cache generated Embeddings in Redis to avoid needing to recompute them.';
        this.icon = 'redis.svg';
        this.category = 'Cache';
        this.baseClasses = [this.type, ...(0, src_1.getBaseClasses)(CacheBackedEmbeddings)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            optional: true,
            credentialNames: ['redisCacheApi', 'redisCacheUrlApi']
        };
        this.inputs = [
            {
                label: 'Embeddings',
                name: 'embeddings',
                type: 'Embeddings'
            },
            {
                label: 'Time to Live (ms)',
                name: 'ttl',
                type: 'number',
                step: 10,
                default: 60 * 60,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Namespace',
                name: 'namespace',
                type: 'string',
                optional: true,
                additionalParams: true
            }
        ];
    }
    async init(nodeData, _, options) {
        let ttl = nodeData.inputs?.ttl;
        const namespace = nodeData.inputs?.namespace;
        const underlyingEmbeddings = nodeData.inputs?.embeddings;
        const credentialData = await (0, src_1.getCredentialData)(nodeData.credential ?? '', options);
        const redisUrl = (0, src_1.getCredentialParam)('redisUrl', credentialData, nodeData);
        let client;
        if (!redisUrl || redisUrl === '') {
            const username = (0, src_1.getCredentialParam)('redisCacheUser', credentialData, nodeData);
            const password = (0, src_1.getCredentialParam)('redisCachePwd', credentialData, nodeData);
            const portStr = (0, src_1.getCredentialParam)('redisCachePort', credentialData, nodeData);
            const host = (0, src_1.getCredentialParam)('redisCacheHost', credentialData, nodeData);
            const sslEnabled = (0, src_1.getCredentialParam)('redisCacheSslEnabled', credentialData, nodeData);
            const tlsOptions = sslEnabled === true ? { tls: { rejectUnauthorized: false } } : {};
            client = new ioredis_1.Redis({
                port: portStr ? parseInt(portStr) : 6379,
                host,
                username,
                password,
                keepAlive: process.env.REDIS_KEEP_ALIVE && !isNaN(parseInt(process.env.REDIS_KEEP_ALIVE, 10))
                    ? parseInt(process.env.REDIS_KEEP_ALIVE, 10)
                    : undefined,
                ...tlsOptions
            });
        }
        else {
            client = new ioredis_1.Redis(redisUrl, {
                keepAlive: process.env.REDIS_KEEP_ALIVE && !isNaN(parseInt(process.env.REDIS_KEEP_ALIVE, 10))
                    ? parseInt(process.env.REDIS_KEEP_ALIVE, 10)
                    : undefined
            });
        }
        ttl ?? (ttl = '3600');
        let ttlNumber = parseInt(ttl, 10);
        const redisStore = new ioredis_2.RedisByteStore({
            client: client,
            ttl: ttlNumber
        });
        const store = CacheBackedEmbeddings.fromBytesStore(underlyingEmbeddings, redisStore, {
            namespace: namespace,
            redisClient: client
        });
        return store;
    }
}
class CacheBackedEmbeddings extends embeddings_1.Embeddings {
    constructor(fields) {
        super(fields);
        this.underlyingEmbeddings = fields.underlyingEmbeddings;
        this.documentEmbeddingStore = fields.documentEmbeddingStore;
        this.redisClient = fields.redisClient;
    }
    async embedQuery(document) {
        const res = this.underlyingEmbeddings.embedQuery(document);
        this.redisClient?.quit();
        return res;
    }
    async embedDocuments(documents) {
        const vectors = await this.documentEmbeddingStore.mget(documents);
        const missingIndicies = [];
        const missingDocuments = [];
        for (let i = 0; i < vectors.length; i += 1) {
            if (vectors[i] === undefined) {
                missingIndicies.push(i);
                missingDocuments.push(documents[i]);
            }
        }
        if (missingDocuments.length) {
            const missingVectors = await this.underlyingEmbeddings.embedDocuments(missingDocuments);
            const keyValuePairs = missingDocuments.map((document, i) => [document, missingVectors[i]]);
            await this.documentEmbeddingStore.mset(keyValuePairs);
            for (let i = 0; i < missingIndicies.length; i += 1) {
                vectors[missingIndicies[i]] = missingVectors[i];
            }
        }
        this.redisClient?.quit();
        return vectors;
    }
    static fromBytesStore(underlyingEmbeddings, documentEmbeddingStore, options) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const encoderBackedStore = new EncoderBackedStore({
            store: documentEmbeddingStore,
            keyEncoder: (key) => (options?.namespace ?? '') + (0, hash_1.sha256)(key),
            valueSerializer: (value) => encoder.encode(JSON.stringify(value)),
            valueDeserializer: (serializedValue) => JSON.parse(decoder.decode(serializedValue))
        });
        return new this({
            underlyingEmbeddings,
            documentEmbeddingStore: encoderBackedStore,
            redisClient: options?.redisClient
        });
    }
}
class EncoderBackedStore extends stores_1.BaseStore {
    constructor(fields) {
        super(fields);
        this.lc_namespace = ['langchain', 'storage'];
        this.store = fields.store;
        this.keyEncoder = fields.keyEncoder;
        this.valueSerializer = fields.valueSerializer;
        this.valueDeserializer = fields.valueDeserializer;
    }
    async mget(keys) {
        const encodedKeys = keys.map(this.keyEncoder);
        const values = await this.store.mget(encodedKeys);
        return values.map((value) => {
            if (value === undefined) {
                return undefined;
            }
            return this.valueDeserializer(value);
        });
    }
    async mset(keyValuePairs) {
        const encodedPairs = keyValuePairs.map(([key, value]) => [
            this.keyEncoder(key),
            this.valueSerializer(value)
        ]);
        return this.store.mset(encodedPairs);
    }
    async mdelete(keys) {
        const encodedKeys = keys.map(this.keyEncoder);
        return this.store.mdelete(encodedKeys);
    }
    async *yieldKeys(prefix) {
        yield* this.store.yieldKeys(prefix);
    }
}
function createDocumentStoreFromByteStore(store) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    return new EncoderBackedStore({
        store,
        keyEncoder: (key) => key,
        valueSerializer: (doc) => encoder.encode(JSON.stringify({ pageContent: doc.pageContent, metadata: doc.metadata })),
        valueDeserializer: (bytes) => new documents_1.Document(JSON.parse(decoder.decode(bytes)))
    });
}
module.exports = { nodeClass: RedisEmbeddingsCache };
//# sourceMappingURL=RedisEmbeddingsCache.js.map