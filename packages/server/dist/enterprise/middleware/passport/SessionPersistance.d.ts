import { RedisStore } from 'connect-redis';
export declare const initializeRedisClientAndStore: () => RedisStore;
export declare const initializeDBClientAndStore: any;
export declare const destroyAllSessionsForUser: (userId: string) => Promise<void>;
