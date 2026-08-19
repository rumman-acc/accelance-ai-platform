import { IActiveCache } from './Interface';
/**
 * This pool is to keep track of in-memory cache used for LLM and Embeddings
 */
export declare class CachePool {
    private redisClient;
    activeLLMCache: IActiveCache;
    activeEmbeddingCache: IActiveCache;
    activeMCPCache: {
        [key: string]: any;
    };
    ssoTokenCache: {
        [key: string]: any;
    };
    constructor();
    /**
     * Add to the sso token cache pool
     * @param {string} ssoToken
     * @param {any} value
     */
    addSSOTokenCache(ssoToken: string, value: any): Promise<void>;
    getSSOTokenCache(ssoToken: string): Promise<any | undefined>;
    deleteSSOTokenCache(ssoToken: string): Promise<void>;
    /**
     * Add to the llm cache pool
     * @param {string} chatflowid
     * @param {Map<any, any>} value
     */
    addLLMCache(chatflowid: string, value: Map<any, any>): Promise<void>;
    /**
     * Add to the embedding cache pool
     * @param {string} chatflowid
     * @param {Map<any, any>} value
     */
    addEmbeddingCache(chatflowid: string, value: Map<any, any>): Promise<void>;
    /**
     * Add to the mcp toolkit cache pool
     * @param {string} cacheKey
     * @param {any} value
     */
    addMCPCache(cacheKey: string, value: any): Promise<void>;
    /**
     * Get item from mcp toolkit cache pool
     * @param {string} cacheKey
     */
    getMCPCache(cacheKey: string): Promise<any | undefined>;
    /**
     * Get item from llm cache pool
     * @param {string} chatflowid
     */
    getLLMCache(chatflowid: string): Promise<Map<any, any> | undefined>;
    /**
     * Get item from embedding cache pool
     * @param {string} chatflowid
     */
    getEmbeddingCache(chatflowid: string): Promise<Map<any, any> | undefined>;
    /**
     * Close Redis connection if applicable
     */
    close(): Promise<void>;
}
export declare function getInstance(): CachePool;
