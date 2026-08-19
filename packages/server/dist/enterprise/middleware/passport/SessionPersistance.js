"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.destroyAllSessionsForUser = exports.initializeDBClientAndStore = exports.initializeRedisClientAndStore = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const connect_redis_1 = require("connect-redis");
const DataSource_1 = require("../../../DataSource");
const path_1 = __importDefault(require("path"));
const utils_1 = require("../../../utils");
const login_session_entity_1 = require("../../database/entities/login-session.entity");
const getRunningExpressApp_1 = require("../../../utils/getRunningExpressApp");
let redisClient = null;
let redisStore = null;
let dbStore = null;
const initializeRedisClientAndStore = () => {
    if (!redisClient) {
        if (process.env.REDIS_URL) {
            redisClient = new ioredis_1.default(process.env.REDIS_URL);
        }
        else {
            redisClient = new ioredis_1.default({
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                username: process.env.REDIS_USERNAME || undefined,
                password: process.env.REDIS_PASSWORD || undefined,
                tls: process.env.REDIS_TLS === 'true'
                    ? {
                        cert: process.env.REDIS_CERT ? Buffer.from(process.env.REDIS_CERT, 'base64') : undefined,
                        key: process.env.REDIS_KEY ? Buffer.from(process.env.REDIS_KEY, 'base64') : undefined,
                        ca: process.env.REDIS_CA ? Buffer.from(process.env.REDIS_CA, 'base64') : undefined
                    }
                    : undefined
            });
        }
    }
    if (!redisStore) {
        redisStore = new connect_redis_1.RedisStore({ client: redisClient });
    }
    return redisStore;
};
exports.initializeRedisClientAndStore = initializeRedisClientAndStore;
const initializeDBClientAndStore = () => {
    if (dbStore)
        return dbStore;
    const databaseType = process.env.DATABASE_TYPE || 'sqlite';
    switch (databaseType) {
        case 'mysql': {
            const expressSession = require('express-session');
            const MySQLStore = require('express-mysql-session')(expressSession);
            const options = {
                host: process.env.DATABASE_HOST,
                port: parseInt(process.env.DATABASE_PORT || '3306'),
                user: process.env.DATABASE_USER,
                password: process.env.DATABASE_PASSWORD,
                database: process.env.DATABASE_NAME,
                createDatabaseTable: true,
                schema: {
                    tableName: 'login_sessions'
                }
            };
            dbStore = new MySQLStore(options);
            return dbStore;
        }
        case 'mariadb':
            /* TODO: Implement MariaDB session store */
            break;
        case 'postgres': {
            // default is postgres
            const pg = require('pg');
            const expressSession = require('express-session');
            const pgSession = require('connect-pg-simple')(expressSession);
            const pgPool = new pg.Pool({
                host: process.env.DATABASE_HOST,
                port: parseInt(process.env.DATABASE_PORT || '5432'),
                user: process.env.DATABASE_USER,
                password: process.env.DATABASE_PASSWORD,
                database: process.env.DATABASE_NAME,
                ssl: (0, DataSource_1.getDatabaseSSLFromEnv)()
            });
            dbStore = new pgSession({
                pool: pgPool, // Connection pool
                tableName: 'login_sessions',
                schemaName: 'public',
                createTableIfMissing: true
            });
            return dbStore;
        }
        case 'default':
        case 'sqlite': {
            const expressSession = require('express-session');
            const sqlSession = require('connect-sqlite3')(expressSession);
            let flowisePath = path_1.default.join((0, utils_1.getUserHome)(), '.accelance');
            const homePath = process.env.DATABASE_PATH ?? flowisePath;
            dbStore = new sqlSession({
                db: 'database.sqlite',
                table: 'login_sessions',
                dir: homePath
            });
            return dbStore;
        }
    }
};
exports.initializeDBClientAndStore = initializeDBClientAndStore;
const getUserIdFromSession = (session) => {
    try {
        const data = typeof session === 'string' ? JSON.parse(session) : session;
        return data?.passport?.user?.id;
    }
    catch {
        return undefined;
    }
};
const destroyAllSessionsForUser = async (userId) => {
    try {
        if (redisStore && redisClient) {
            const prefix = redisStore?.prefix ?? 'sess:';
            const pattern = `${prefix}*`;
            const keysToDelete = [];
            const batchSize = 1000;
            const stream = redisClient.scanStream({
                match: pattern,
                count: batchSize
            });
            for await (const keysBatch of stream) {
                if (keysBatch.length === 0)
                    continue;
                const sessions = await redisClient.mget(...keysBatch);
                for (let i = 0; i < sessions.length; i++) {
                    if (getUserIdFromSession(sessions[i]) === userId) {
                        keysToDelete.push(keysBatch[i]);
                    }
                }
                if (keysToDelete.length >= batchSize) {
                    const pipeline = redisClient.pipeline();
                    keysToDelete.splice(0, batchSize).forEach((key) => pipeline.del(key));
                    await pipeline.exec();
                }
            }
            if (keysToDelete.length > 0) {
                const pipeline = redisClient.pipeline();
                keysToDelete.forEach((key) => pipeline.del(key));
                await pipeline.exec();
            }
        }
        else if (dbStore) {
            const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
            const dataSource = appServer.AppDataSource;
            const repository = dataSource.getRepository(login_session_entity_1.LoginSession);
            const databaseType = process.env.DATABASE_TYPE || 'sqlite';
            switch (databaseType) {
                case 'sqlite':
                    await repository
                        .createQueryBuilder()
                        .delete()
                        .where(`json_extract(sess, '$.passport.user.id') = :userId`, { userId })
                        .execute();
                    break;
                case 'mysql':
                    await repository
                        .createQueryBuilder()
                        .delete()
                        .where(`JSON_EXTRACT(data, '$.passport.user.id') = :userId`, { userId }) // express-mysql-session uses column name 'data' for session payload, not 'sess'
                        .execute();
                    break;
                case 'postgres':
                    await repository.createQueryBuilder().delete().where(`sess->'passport'->'user'->>'id' = :userId`, { userId }).execute();
                    break;
                default:
                    console.warn('Unsupported database type:', databaseType);
                    break;
            }
        }
        else {
            console.warn('Session store not available, skipping session invalidation');
        }
    }
    catch (error) {
        console.error('Error destroying sessions for user:', error);
        throw error;
    }
};
exports.destroyAllSessionsForUser = destroyAllSessionsForUser;
//# sourceMappingURL=SessionPersistance.js.map