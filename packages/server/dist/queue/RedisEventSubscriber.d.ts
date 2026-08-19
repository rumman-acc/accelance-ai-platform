import { SSEStreamer } from '../utils/SSEStreamer';
export declare class RedisEventSubscriber {
    private redisSubscriber;
    private sseStreamer;
    private subscribedChannels;
    private cleanupInterval;
    constructor(sseStreamer: SSEStreamer);
    private setupEventListeners;
    connect(): Promise<void>;
    subscribe(channel: string): Promise<void>;
    unsubscribe(channel: string): Promise<void>;
    getSubscriptionCount(): number;
    startPeriodicCleanup(intervalMs?: number): void;
    private handleEvent;
    disconnect(): Promise<void>;
}
