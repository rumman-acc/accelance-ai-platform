export declare class UsageCacheManager {
    private cache;
    private static instance;
    static getInstance(): Promise<UsageCacheManager>;
    private initialize;
    getSubscriptionDetails(subscriptionId: string, withoutCache?: boolean): Promise<Record<string, any>>;
    getQuotas(subscriptionId: string, withoutCache?: boolean): Promise<Record<string, number>>;
    getSubscriptionDataFromCache(subscriptionId: string): Promise<{
        quotas?: Record<string, number>;
        productId?: string;
        features?: Record<string, string>;
        subsriptionDetails?: Record<string, any>;
    } | null>;
    updateSubscriptionDataToCache(subscriptionId: string, data: Partial<{
        quotas: Record<string, number>;
        productId: string;
        features: Record<string, string>;
        subsriptionDetails: Record<string, any>;
    }>): Promise<void>;
    get<T>(key: string): Promise<T | null>;
    getTTL(key: string): Promise<number | null>;
    mget<T>(keys: string[]): Promise<(T | null)[]>;
    set<T>(key: string, value: T, ttl?: number): void;
    mset<T>(keys: [{
        key: string;
        value: T;
        ttl: number;
    }]): void;
    del(key: string): Promise<void>;
    mdel(keys: string[]): Promise<void>;
    clear(): Promise<void>;
    wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T>;
}
