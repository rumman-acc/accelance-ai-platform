"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
exports.start = start;
exports.getInstance = getInstance;
const express_1 = require("@bull-board/express");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_2 = __importDefault(require("express"));
require("global-agent/bootstrap");
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const AbortControllerPool_1 = require("./AbortControllerPool");
const CachePool_1 = require("./CachePool");
const ChatFlow_1 = require("./database/entities/ChatFlow");
const DataSource_1 = require("./DataSource");
const organization_entity_1 = require("./enterprise/database/entities/organization.entity");
const workspace_entity_1 = require("./enterprise/database/entities/workspace.entity");
const passport_1 = require("./enterprise/middleware/passport");
const authSecrets_1 = require("./enterprise/utils/authSecrets");
const IdentityManager_1 = require("./IdentityManager");
const Interface_1 = require("./Interface");
const OpenTelemetry_1 = require("./metrics/OpenTelemetry");
const Prometheus_1 = require("./metrics/Prometheus");
const errors_1 = __importDefault(require("./middlewares/errors"));
const NodesPool_1 = require("./NodesPool");
const QueueManager_1 = require("./queue/QueueManager");
const ScheduleBeat_1 = require("./schedule/ScheduleBeat");
const RetentionCleanup_1 = require("./schedule/RetentionCleanup");
const RedisEventSubscriber_1 = require("./queue/RedisEventSubscriber");
const refreshModelList_1 = require("./jobs/refreshModelList");
const webhook_listener_1 = require("./services/webhook-listener");
const routes_1 = __importDefault(require("./routes"));
const UsageCacheManager_1 = require("./UsageCacheManager");
const utils_1 = require("./utils");
const constants_1 = require("./utils/constants");
const logger_1 = __importStar(require("./utils/logger"));
const rateLimit_1 = require("./utils/rateLimit");
const SSEStreamer_1 = require("./utils/SSEStreamer");
const telemetry_1 = require("./utils/telemetry");
const validateKey_1 = require("./utils/validateKey");
const XSS_1 = require("./utils/XSS");
class App {
    constructor() {
        this.AppDataSource = (0, DataSource_1.getDataSource)();
        this.app = (0, express_2.default)();
    }
    async initDatabase() {
        // Initialize database
        try {
            await (0, utils_1.getEncryptionKey)();
            logger_1.default.info('🔑 [server]: Encryption key initialized successfully');
            await (0, authSecrets_1.initAuthSecrets)();
            logger_1.default.info('🔐 [server]: Auth initialized successfully');
            await this.AppDataSource.initialize();
            logger_1.default.info('📦 [server]: Data Source initialized successfully');
            // Run Migrations Scripts
            await this.AppDataSource.runMigrations({ transaction: 'each' });
            logger_1.default.info('🔄 [server]: Database migrations completed successfully');
            // Initialize Identity Manager
            this.identityManager = await IdentityManager_1.IdentityManager.getInstance();
            logger_1.default.info('🔐 [server]: Identity Manager initialized successfully');
            // Initialize nodes pool
            this.nodesPool = new NodesPool_1.NodesPool();
            await this.nodesPool.initialize();
            logger_1.default.info('🔧 [server]: Nodes pool initialized successfully');
            // Initialize abort controllers pool
            this.abortControllerPool = new AbortControllerPool_1.AbortControllerPool();
            logger_1.default.info('⏹️ [server]: Abort controllers pool initialized successfully');
            // Initialize encryption key
            await (0, utils_1.getEncryptionKey)();
            logger_1.default.info('🔑 [server]: Encryption key initialized successfully');
            // Initialize auth secrets (env → AWS Secrets Manager → filesystem)
            await (0, authSecrets_1.initAuthSecrets)();
            logger_1.default.info('🔐 [server]: Auth initialized successfully');
            // Initialize Rate Limit
            this.rateLimiterManager = rateLimit_1.RateLimiterManager.getInstance();
            await this.rateLimiterManager.initializeRateLimiters(await (0, DataSource_1.getDataSource)().getRepository(ChatFlow_1.ChatFlow).find());
            logger_1.default.info('🚦 [server]: Rate limiters initialized successfully');
            // Initialize cache pool
            this.cachePool = new CachePool_1.CachePool();
            logger_1.default.info('💾 [server]: Cache pool initialized successfully');
            // Initialize usage cache manager
            this.usageCacheManager = await UsageCacheManager_1.UsageCacheManager.getInstance();
            logger_1.default.info('📊 [server]: Usage cache manager initialized successfully');
            // Initialize telemetry
            this.telemetry = new telemetry_1.Telemetry();
            logger_1.default.info('📈 [server]: Telemetry initialized successfully');
            // Initialize SSE Streamer
            this.sseStreamer = new SSEStreamer_1.SSEStreamer();
            this.sseStreamer.startHeartbeat();
            logger_1.default.info('🌊 [server]: SSE Streamer initialized successfully');
            // Init Queues
            if (process.env.MODE === Interface_1.MODE.QUEUE) {
                this.queueManager = QueueManager_1.QueueManager.getInstance();
                const serverAdapter = new express_1.ExpressAdapter();
                serverAdapter.setBasePath('/admin/queues');
                this.queueManager.setupAllQueues({
                    componentNodes: this.nodesPool.componentNodes,
                    telemetry: this.telemetry,
                    cachePool: this.cachePool,
                    appDataSource: this.AppDataSource,
                    abortControllerPool: this.abortControllerPool,
                    usageCacheManager: this.usageCacheManager,
                    identityManager: this.identityManager,
                    serverAdapter
                });
                logger_1.default.info('✅ [Queue]: All queues setup successfully');
                this.redisSubscriber = new RedisEventSubscriber_1.RedisEventSubscriber(this.sseStreamer);
                await this.redisSubscriber.connect();
                this.redisSubscriber.startPeriodicCleanup();
                logger_1.default.info('🔗 [server]: Redis event subscriber connected successfully');
            }
            await (0, webhook_listener_1.initWebhookListenerRegistry)(this.sseStreamer, this.redisSubscriber);
            logger_1.default.info('📡 [server]: Webhook listener registry initialized successfully');
            // Init ScheduleBeat (works in both queue and non-queue mode)
            await ScheduleBeat_1.ScheduleBeat.getInstance().init();
            logger_1.default.info('⏰ [server]: ScheduleBeat initialized successfully');
            // Data Retention Policy guardrail: daily cleanup job, independent of ScheduleBeat
            // (that system is for user-created flow schedules, not this system-level job)
            (0, RetentionCleanup_1.startRetentionCleanupJob)();
            (0, refreshModelList_1.registerModelRefreshJob)();
            logger_1.default.info('🎉 [server]: All initialization steps completed successfully!');
        }
        catch (error) {
            logger_1.default.error('❌ [server]: Error during Data Source initialization:', error);
        }
    }
    async config() {
        // Legacy alias: rewrite /api/v1/* to /api/* so external callers on the old prefix
        // (published SDK, existing API docs/snippets) keep working against the single
        // canonical /api mount below. Case-sensitive on purpose - the auth gate further down
        // deliberately rejects case-varied paths like /API/v1/..., and a case-insensitive
        // rewrite here would silently defeat that check.
        //
        // SSO login/callback/logout paths are excluded and stay on /api/v1 permanently: their
        // exact URL is independently registered as an "allowed callback URL" inside each
        // organization's external IdP (Auth0/Google/Azure/GitHub) app config, which our server
        // has no way to update. Rewriting the incoming request wouldn't help - the IdP itself
        // would reject the redirect before it ever reaches us.
        const SSO_PROVIDER_PATH_SEGMENTS = ['/api/v1/azure/', '/api/v1/google/', '/api/v1/auth0/', '/api/v1/github/'];
        this.app.use((req, _res, next) => {
            const isLegacyV1 = req.url === '/api/v1' || req.url.startsWith('/api/v1/');
            const isSsoProviderPath = SSO_PROVIDER_PATH_SEGMENTS.some((prefix) => req.url.startsWith(prefix));
            if (isLegacyV1 && !isSsoProviderPath) {
                req.url = '/api' + req.url.slice('/api/v1'.length);
            }
            next();
        });
        // Limit is needed to allow sending/receiving base64 encoded string
        const flowise_file_size_limit = process.env.FILE_SIZE_LIMIT || '50mb';
        // Preserve raw bytes before JSON parsing for webhook HMAC signature verification
        const captureRawBody = (req, _res, buf) => {
            ;
            req.rawBody = buf;
        };
        this.app.use(express_2.default.json({ limit: flowise_file_size_limit, verify: captureRawBody }));
        this.app.use(express_2.default.urlencoded({ limit: flowise_file_size_limit, extended: true, verify: captureRawBody }));
        // Enhanced trust proxy settings for load balancer
        let trustProxy = process.env.TRUST_PROXY;
        if (typeof trustProxy === 'undefined' || trustProxy.trim() === '' || trustProxy === 'true') {
            // Default to trust all proxies
            trustProxy = true;
        }
        else if (trustProxy === 'false') {
            // Disable trust proxy
            trustProxy = false;
        }
        else if (!isNaN(Number(trustProxy))) {
            // Number: Trust specific number of proxies
            trustProxy = Number(trustProxy);
        }
        this.app.set('trust proxy', trustProxy);
        // Allow access from specified domains
        (0, XSS_1.validateCorsConfig)();
        this.app.use((0, cors_1.default)((0, XSS_1.getCorsOptions)()));
        // Parse cookies
        this.app.use((0, cookie_parser_1.default)());
        // Allow embedding from specified domains.
        const iframeSecurityHeaders = (0, XSS_1.getIframeSecurityHeaders)();
        this.app.use((req, res, next) => {
            for (const [headerName, headerValue] of Object.entries(iframeSecurityHeaders)) {
                res.setHeader(headerName, headerValue);
            }
            next();
        });
        // Switch off the default 'X-Powered-By: Express' header
        this.app.disable('x-powered-by');
        // Add the expressRequestLogger middleware to log all requests
        this.app.use(logger_1.expressRequestLogger);
        // Add the sanitizeMiddleware to guard against XSS
        this.app.use(XSS_1.sanitizeMiddleware);
        const denylistURLs = process.env.DENYLIST_URLS ? process.env.DENYLIST_URLS.split(',') : [];
        const whitelistURLs = constants_1.WHITELIST_URLS.filter((url) => !denylistURLs.includes(url));
        const URL_CASE_INSENSITIVE_REGEX = /\/api\//i;
        const URL_CASE_SENSITIVE_REGEX = /\/api\//;
        await (0, passport_1.initializeJwtCookieMiddleware)(this.app, this.identityManager);
        this.app.use(async (req, res, next) => {
            // Step 1: Check if the req path contains /api regardless of case
            if (URL_CASE_INSENSITIVE_REGEX.test(req.path)) {
                // Step 2: Check if the req path is casesensitive
                if (URL_CASE_SENSITIVE_REGEX.test(req.path)) {
                    // Step 3: Check if the req path is in the whitelist
                    const isWhitelisted = whitelistURLs.some((url) => req.path.startsWith(url));
                    if (isWhitelisted) {
                        next();
                    }
                    else if (req.headers['x-request-from'] === 'internal') {
                        (0, passport_1.verifyToken)(req, res, next);
                    }
                    else {
                        const isAPIKeyBlacklistedURLS = constants_1.API_KEY_BLACKLIST_URLS.some((url) => req.path.startsWith(url));
                        if (isAPIKeyBlacklistedURLS) {
                            return res.status(401).json({ error: 'Unauthorized Access' });
                        }
                        // Only check license validity for non-open-source platforms
                        if (this.identityManager.getPlatformType() !== Interface_1.Platform.OPEN_SOURCE) {
                            if (!this.identityManager.isLicenseValid()) {
                                return res.status(401).json({ error: 'Unauthorized Access' });
                            }
                        }
                        const { isValid, apiKey } = await (0, validateKey_1.validateAPIKey)(req);
                        if (!isValid || !apiKey) {
                            return res.status(401).json({ error: 'Unauthorized Access' });
                        }
                        // Find workspace
                        const workspace = await this.AppDataSource.getRepository(workspace_entity_1.Workspace).findOne({
                            where: { id: apiKey.workspaceId }
                        });
                        if (!workspace) {
                            return res.status(401).json({ error: 'Unauthorized Access' });
                        }
                        // Find organization
                        const activeOrganizationId = workspace.organizationId;
                        const org = await this.AppDataSource.getRepository(organization_entity_1.Organization).findOne({
                            where: { id: activeOrganizationId }
                        });
                        if (!org) {
                            return res.status(401).json({ error: 'Unauthorized Access' });
                        }
                        const subscriptionId = org.subscriptionId;
                        const customerId = org.customerId;
                        const features = await this.identityManager.getFeaturesByPlan(subscriptionId);
                        const productId = await this.identityManager.getProductIdFromSubscription(subscriptionId);
                        // @ts-ignore
                        req.user = {
                            permissions: apiKey.permissions,
                            features,
                            activeOrganizationId: activeOrganizationId,
                            activeOrganizationSubscriptionId: subscriptionId,
                            activeOrganizationCustomerId: customerId,
                            activeOrganizationProductId: productId,
                            isOrganizationAdmin: false,
                            activeWorkspaceId: workspace.id,
                            activeWorkspace: workspace.name
                        };
                        next();
                    }
                }
                else {
                    return res.status(401).json({ error: 'Unauthorized Access' });
                }
            }
            else {
                // If the req path does not contain /api, then allow the request to pass through, example: /assets, /canvas
                next();
            }
        });
        // this is for SSO and must be after the JWT cookie middleware
        await this.identityManager.initializeSSO(this.app);
        if (process.env.ENABLE_METRICS === 'true') {
            switch (process.env.METRICS_PROVIDER) {
                // default to prometheus
                case 'prometheus':
                case undefined:
                    this.metricsProvider = new Prometheus_1.Prometheus(this.app);
                    break;
                case 'open_telemetry':
                    this.metricsProvider = new OpenTelemetry_1.OpenTelemetry(this.app);
                    break;
                // add more cases for other metrics providers here
            }
            if (this.metricsProvider) {
                await this.metricsProvider.initializeCounters();
                logger_1.default.info(`📊 [server]: Metrics Provider [${this.metricsProvider.getName()}] has been initialized!`);
            }
            else {
                logger_1.default.error("❌ [server]: Metrics collection is enabled, but failed to initialize provider (valid values are 'prometheus' or 'open_telemetry'.");
            }
        }
        this.app.use('/api', routes_1.default);
        // ----------------------------------------
        // Configure number of proxies in Host Environment
        // ----------------------------------------
        this.app.get('/api/ip', (request, response) => {
            response.send({
                ip: request.ip,
                msg: 'Check returned IP address in the response. If it matches your current IP address ( which you can get by going to http://ip.nfriedly.com/ or https://api.ipify.org/ ), then the number of proxies is correct and the rate limiter should now work correctly. If not, increase the number of proxies by 1 and restart Cloud-Hosted Accelance until the IP address matches your own. Visit https://docs.flowiseai.com/configuration/rate-limit#cloud-hosted-rate-limit-setup-guide for more information.'
            });
        });
        if (process.env.MODE === Interface_1.MODE.QUEUE && process.env.ENABLE_BULLMQ_DASHBOARD === 'true' && !this.identityManager.isCloud()) {
            // Initialize admin queues rate limiter
            const id = 'bullmq_admin_dashboard';
            await this.rateLimiterManager.addRateLimiter(id, 60, 100, process.env.ADMIN_RATE_LIMIT_MESSAGE || 'Too many requests to admin dashboard, please try again later.');
            const rateLimiter = this.rateLimiterManager.getRateLimiterById(id);
            this.app.use('/admin/queues', rateLimiter, passport_1.verifyTokenForBullMQDashboard, this.queueManager.getBullBoardRouter());
        }
        // ----------------------------------------
        // Serve UI static
        // ----------------------------------------
        const packagePath = (0, utils_1.getNodeModulesPackagePath)('accelance-ui');
        const uiBuildPath = path_1.default.join(packagePath, 'build');
        const uiHtmlPath = path_1.default.join(packagePath, 'build', 'index.html');
        this.app.use('/', express_2.default.static(uiBuildPath));
        // All other requests not handled will return React app
        this.app.use((req, res) => {
            res.sendFile(uiHtmlPath);
        });
        // Error handling
        this.app.use(errors_1.default);
    }
    async stopApp() {
        try {
            this.sseStreamer.stopHeartbeat();
            (0, refreshModelList_1.stopModelRefreshJob)();
            const removePromises = [];
            removePromises.push(this.telemetry.flush());
            if (this.queueManager) {
                removePromises.push(this.redisSubscriber.disconnect());
            }
            await Promise.all(removePromises);
        }
        catch (e) {
            logger_1.default.error(`❌[server]: Accelance Server shut down error: ${e}`);
        }
    }
}
exports.App = App;
let serverApp;
async function start() {
    serverApp = new App();
    const host = process.env.HOST;
    const port = parseInt(process.env.PORT || '', 10) || 3000;
    const server = http_1.default.createServer(serverApp.app);
    await serverApp.initDatabase();
    await serverApp.config();
    server.listen(port, host, () => {
        logger_1.default.info(`⚡️ [server]: Accelance Server is listening at ${host ? 'http://' + host : ''}:${port}`);
    });
}
function getInstance() {
    return serverApp;
}
//# sourceMappingURL=index.js.map