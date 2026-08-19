import { BaseStore } from '@langchain/core/stores';
import { Document } from '@langchain/core/documents';
declare class EncoderBackedStore<K, V, SerializedType = any> extends BaseStore<K, V> {
    lc_namespace: string[];
    store: BaseStore<string, SerializedType>;
    keyEncoder: (key: K) => string;
    valueSerializer: (value: V) => SerializedType;
    valueDeserializer: (value: SerializedType) => V;
    constructor(fields: {
        store: BaseStore<string, SerializedType>;
        keyEncoder: (key: K) => string;
        valueSerializer: (value: V) => SerializedType;
        valueDeserializer: (value: SerializedType) => V;
    });
    mget(keys: K[]): Promise<(V | undefined)[]>;
    mset(keyValuePairs: [K, V][]): Promise<void>;
    mdelete(keys: K[]): Promise<void>;
    yieldKeys(prefix?: string | undefined): AsyncGenerator<string | K>;
}
export declare function createDocumentStoreFromByteStore(store: BaseStore<string, Uint8Array>): EncoderBackedStore<string, Document<Record<string, any>>, Uint8Array>;
export {};
