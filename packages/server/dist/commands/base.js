"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCommand = void 0;
const core_1 = require("@oclif/core");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../utils/logger"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '..', '..', '.env'), override: true });
var EXIT_CODE;
(function (EXIT_CODE) {
    EXIT_CODE[EXIT_CODE["SUCCESS"] = 0] = "SUCCESS";
    EXIT_CODE[EXIT_CODE["FAILED"] = 1] = "FAILED";
})(EXIT_CODE || (EXIT_CODE = {}));
class BaseCommand extends core_1.Command {
    async stopProcess() {
        // Overridden method by child class
    }
    onTerminate() {
        return async () => {
            try {
                // Shut down the app after timeout if it ever stuck removing pools
                setTimeout(async () => {
                    logger_1.default.info('Accelance was forced to shut down after 30 secs');
                    await this.failExit();
                }, 30000);
                await this.stopProcess();
            }
            catch (error) {
                logger_1.default.error('There was an error shutting down Accelance...', error);
            }
        };
    }
    async gracefullyExit() {
        process.exit(EXIT_CODE.SUCCESS);
    }
    async failExit() {
        process.exit(EXIT_CODE.FAILED);
    }
    async init() {
        await super.init();
        process.on('SIGTERM', this.onTerminate());
        process.on('SIGINT', this.onTerminate());
        // Prevent throw new Error from crashing the app
        // TODO: Get rid of this and send proper error message to ui
        process.on('uncaughtException', (err) => {
            logger_1.default.error('uncaughtException: ', err);
        });
        process.on('unhandledRejection', (err) => {
            logger_1.default.error('unhandledRejection: ', err);
        });
        const { flags } = await this.parse(this.constructor);
        Object.keys(flags).forEach((key) => {
            if (Object.prototype.hasOwnProperty.call(flags, key) && flags[key]) {
                process.env[key] = flags[key];
            }
        });
    }
}
exports.BaseCommand = BaseCommand;
BaseCommand.flags = {
    // General Settings
    FILE_SIZE_LIMIT: core_1.Flags.string(),
    CUSTOM_MCP_TOOLS_MAX_BYTES: core_1.Flags.string(),
    CUSTOM_MCP_AUTHORIZE_TIMEOUT_MS: core_1.Flags.string(),
    PORT: core_1.Flags.string(),
    CORS_ORIGINS: core_1.Flags.string(),
    MCP_CORS_ORIGINS: core_1.Flags.string(),
    IFRAME_ORIGINS: core_1.Flags.string(),
    DEBUG: core_1.Flags.string(),
    NUMBER_OF_PROXIES: core_1.Flags.string(),
    SHOW_COMMUNITY_NODES: core_1.Flags.string(),
    DISABLE_TELEMETRY: core_1.Flags.string(),
    DISABLED_NODES: core_1.Flags.string(),
    // Logging
    LOG_PATH: core_1.Flags.string(),
    LOG_LEVEL: core_1.Flags.string(),
    LOG_SANITIZE_BODY_FIELDS: core_1.Flags.string(),
    LOG_SANITIZE_HEADER_FIELDS: core_1.Flags.string(),
    // Custom tool/function dependencies
    TOOL_FUNCTION_BUILTIN_DEP: core_1.Flags.string(),
    TOOL_FUNCTION_EXTERNAL_DEP: core_1.Flags.string(),
    ALLOW_BUILTIN_DEP: core_1.Flags.string(),
    // Database
    DATABASE_TYPE: core_1.Flags.string(),
    DATABASE_PATH: core_1.Flags.string(),
    DATABASE_PORT: core_1.Flags.string(),
    DATABASE_HOST: core_1.Flags.string(),
    DATABASE_NAME: core_1.Flags.string(),
    DATABASE_USER: core_1.Flags.string(),
    DATABASE_PASSWORD: core_1.Flags.string(),
    DATABASE_SSL: core_1.Flags.string(),
    DATABASE_SSL_KEY_BASE64: core_1.Flags.string(),
    DATABASE_REJECT_UNAUTHORIZED: core_1.Flags.string(),
    // Langsmith tracing
    LANGCHAIN_TRACING_V2: core_1.Flags.string(),
    LANGCHAIN_ENDPOINT: core_1.Flags.string(),
    LANGCHAIN_API_KEY: core_1.Flags.string(),
    LANGCHAIN_PROJECT: core_1.Flags.string(),
    LANGSMITH_TRACING: core_1.Flags.string(),
    LANGSMITH_API_KEY: core_1.Flags.string(),
    LANGSMITH_ENDPOINT: core_1.Flags.string(),
    LANGSMITH_PROJECT: core_1.Flags.string(),
    // Langfuse tracing
    LANGFUSE_SECRET_KEY: core_1.Flags.string(),
    LANGFUSE_PUBLIC_KEY: core_1.Flags.string(),
    LANGFUSE_BASE_URL: core_1.Flags.string(),
    LANGFUSE_RELEASE: core_1.Flags.string(),
    // Model list config
    MODEL_LIST_CONFIG_JSON: core_1.Flags.string(),
    // Storage
    STORAGE_TYPE: core_1.Flags.string(),
    BLOB_STORAGE_PATH: core_1.Flags.string(),
    S3_STORAGE_BUCKET_NAME: core_1.Flags.string(),
    S3_STORAGE_ACCESS_KEY_ID: core_1.Flags.string(),
    S3_STORAGE_SECRET_ACCESS_KEY: core_1.Flags.string(),
    S3_STORAGE_REGION: core_1.Flags.string(),
    S3_ENDPOINT_URL: core_1.Flags.string(),
    S3_FORCE_PATH_STYLE: core_1.Flags.string(),
    GOOGLE_CLOUD_STORAGE_CREDENTIAL: core_1.Flags.string(),
    GOOGLE_CLOUD_STORAGE_PROJ_ID: core_1.Flags.string(),
    GOOGLE_CLOUD_STORAGE_BUCKET_NAME: core_1.Flags.string(),
    GOOGLE_CLOUD_UNIFORM_BUCKET_ACCESS: core_1.Flags.string(),
    AZURE_BLOB_STORAGE_CONNECTION_STRING: core_1.Flags.string(),
    AZURE_BLOB_STORAGE_ACCOUNT_NAME: core_1.Flags.string(),
    AZURE_BLOB_STORAGE_ACCOUNT_KEY: core_1.Flags.string(),
    AZURE_BLOB_STORAGE_CONTAINER_NAME: core_1.Flags.string(),
    // Credentials / Secret Keys
    SECRETKEY_STORAGE_TYPE: core_1.Flags.string(),
    SECRETKEY_PATH: core_1.Flags.string(),
    SECRETKEY_OVERWRITE: core_1.Flags.string(),
    SECRETKEY_AWS_ACCESS_KEY: core_1.Flags.string(),
    SECRETKEY_AWS_SECRET_KEY: core_1.Flags.string(),
    SECRETKEY_AWS_REGION: core_1.Flags.string(),
    SECRETKEY_AWS_NAME: core_1.Flags.string(),
    // Queue
    MODE: core_1.Flags.string(),
    WORKER_CONCURRENCY: core_1.Flags.string(),
    QUEUE_NAME: core_1.Flags.string(),
    QUEUE_REDIS_EVENT_STREAM_MAX_LEN: core_1.Flags.string(),
    REMOVE_ON_AGE: core_1.Flags.string(),
    REMOVE_ON_COUNT: core_1.Flags.string(),
    REDIS_URL: core_1.Flags.string(),
    REDIS_HOST: core_1.Flags.string(),
    REDIS_PORT: core_1.Flags.string(),
    REDIS_USERNAME: core_1.Flags.string(),
    REDIS_PASSWORD: core_1.Flags.string(),
    REDIS_TLS: core_1.Flags.string(),
    REDIS_CERT: core_1.Flags.string(),
    REDIS_KEY: core_1.Flags.string(),
    REDIS_CA: core_1.Flags.string(),
    REDIS_KEEP_ALIVE: core_1.Flags.string(),
    ENABLE_BULLMQ_DASHBOARD: core_1.Flags.string(),
    // Security
    CUSTOM_MCP_SECURITY_CHECK: core_1.Flags.string(),
    CUSTOM_MCP_PROTOCOL: core_1.Flags.string(),
    CUSTOM_MCP_ALLOWED_ENV_VARS: core_1.Flags.string(),
    HTTP_DENY_LIST: core_1.Flags.string(),
    HTTP_SECURITY_CHECK: core_1.Flags.string(),
    PATH_TRAVERSAL_SAFETY: core_1.Flags.string(),
    TRUST_PROXY: core_1.Flags.string(),
    OAUTH2_SECURITY_CHECK: core_1.Flags.string(),
    OAUTH2_ALLOWED_TOKEN_DOMAINS: core_1.Flags.string(),
    // Auth
    APP_URL: core_1.Flags.string(),
    SMTP_HOST: core_1.Flags.string(),
    SMTP_PORT: core_1.Flags.string(),
    SMTP_USER: core_1.Flags.string(),
    SMTP_PASSWORD: core_1.Flags.string(),
    SMTP_SECURE: core_1.Flags.string(),
    ALLOW_UNAUTHORIZED_CERTS: core_1.Flags.string(),
    SENDER_EMAIL: core_1.Flags.string(),
    JWT_AUTH_TOKEN_SECRET: core_1.Flags.string(),
    JWT_REFRESH_TOKEN_SECRET: core_1.Flags.string(),
    JWT_ISSUER: core_1.Flags.string(),
    JWT_AUDIENCE: core_1.Flags.string(),
    JWT_TOKEN_EXPIRY_IN_MINUTES: core_1.Flags.string(),
    JWT_REFRESH_TOKEN_EXPIRY_IN_MINUTES: core_1.Flags.string(),
    EXPIRE_AUTH_TOKENS_ON_RESTART: core_1.Flags.string(),
    EXPRESS_SESSION_SECRET: core_1.Flags.string(),
    SECURE_COOKIES: core_1.Flags.string(),
    INVITE_TOKEN_EXPIRY_IN_HOURS: core_1.Flags.string(),
    PASSWORD_RESET_TOKEN_EXPIRY_IN_MINS: core_1.Flags.string(),
    PASSWORD_SALT_HASH_ROUNDS: core_1.Flags.string(),
    TOKEN_HASH_SECRET: core_1.Flags.string(),
    WORKSPACE_INVITE_TEMPLATE_PATH: core_1.Flags.string(),
    // Enterprise
    LICENSE_URL: core_1.Flags.string(),
    ACCELANCE_EE_LICENSE_KEY: core_1.Flags.string(),
    OFFLINE: core_1.Flags.string(),
    // Metrics
    POSTHOG_PUBLIC_API_KEY: core_1.Flags.string(),
    ENABLE_METRICS: core_1.Flags.string(),
    METRICS_PROVIDER: core_1.Flags.string(),
    METRICS_INCLUDE_NODE_METRICS: core_1.Flags.string(),
    METRICS_SERVICE_NAME: core_1.Flags.string(),
    METRICS_OPEN_TELEMETRY_METRIC_ENDPOINT: core_1.Flags.string(),
    METRICS_OPEN_TELEMETRY_PROTOCOL: core_1.Flags.string(),
    METRICS_OPEN_TELEMETRY_DEBUG: core_1.Flags.string(),
    // Proxy
    GLOBAL_AGENT_HTTP_PROXY: core_1.Flags.string(),
    GLOBAL_AGENT_HTTPS_PROXY: core_1.Flags.string(),
    GLOBAL_AGENT_NO_PROXY: core_1.Flags.string(),
    // Document Loaders
    PUPPETEER_EXECUTABLE_FILE_PATH: core_1.Flags.string(),
    PLAYWRIGHT_EXECUTABLE_FILE_PATH: core_1.Flags.string(),
    // Schedule
    MIN_SCHEDULE_INTERVAL_SECONDS: core_1.Flags.string()
};
//# sourceMappingURL=base.js.map