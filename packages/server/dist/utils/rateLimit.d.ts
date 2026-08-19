import { NextFunction, Request, Response } from 'express';
import { IChatFlow } from '../Interface';
export declare class RateLimiterManager {
    private rateLimiters;
    private rateLimiterMutex;
    private redisClient;
    private static instance;
    private queueEventsProducer;
    private queueEvents;
    constructor();
    getConnection(): {
        url: string | undefined;
        host: string;
        port: number;
        username: string | undefined;
        password: string | undefined;
        tls: {
            rejectUnauthorized: boolean;
            cert?: undefined;
            key?: undefined;
            ca?: undefined;
        } | {
            cert: Buffer | undefined;
            key: Buffer | undefined;
            ca: Buffer | undefined;
            rejectUnauthorized?: undefined;
        } | undefined;
        maxRetriesPerRequest: null;
        enableReadyCheck: boolean;
        keepAlive: number | undefined;
    };
    static getInstance(): RateLimiterManager;
    addRateLimiter(id: string, duration: number, limit: number, message: string): Promise<void>;
    removeRateLimiter(id: string): void;
    getRateLimiter(): (req: Request, res: Response, next: NextFunction) => void;
    getRateLimiterById(id: string): (req: Request, res: Response, next: NextFunction) => void;
    updateRateLimiter(chatFlow: IChatFlow, isInitialized?: boolean): Promise<void>;
    initializeRateLimiters(chatflows: IChatFlow[]): Promise<void>;
}
