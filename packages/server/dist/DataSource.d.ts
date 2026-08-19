import 'reflect-metadata';
import { DataSource } from 'typeorm';
export declare const init: () => Promise<void>;
export declare function getDataSource(): DataSource;
export declare const getDatabaseSSLFromEnv: () => true | {
    rejectUnauthorized: boolean;
    ca: Buffer;
} | undefined;
