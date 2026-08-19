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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prometheus = void 0;
const Interface_Metrics_1 = require("../Interface.Metrics");
const prom_client_1 = __importStar(require("prom-client"));
const accelance_components_1 = require("accelance-components");
class Prometheus {
    constructor(app) {
        this.app = app;
        // Clear any existing default registry metrics to avoid conflicts
        prom_client_1.default.register.clear();
        // Create a separate registry for our metrics
        this.register = new prom_client_1.default.Registry();
    }
    getName() {
        return 'Prometheus';
    }
    async initializeCounters() {
        const serviceName = process.env.METRICS_SERVICE_NAME || 'Accelance';
        this.register.setDefaultLabels({
            app: serviceName
        });
        // look at the FLOWISE_COUNTER enum in Interface.Metrics.ts and get all values
        // for each counter in the enum, create a new promClient.Counter and add it to the registry
        this.counters = new Map();
        const enumEntries = Object.entries(Interface_Metrics_1.ACCELANCE_METRIC_COUNTERS);
        enumEntries.forEach(([name, value]) => {
            // derive proper counter name from the enum value (chatflow_created = Chatflow Created)
            const properCounterName = name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
            try {
                this.counters.set(value, new prom_client_1.default.Counter({
                    name: value,
                    help: `Total number of ${properCounterName}`,
                    labelNames: ['status'],
                    registers: [this.register] // Explicitly set the registry
                }));
            }
            catch (error) {
                // If metric already exists, get it from the registry instead
                const existingMetrics = this.register.getSingleMetric(value);
                if (existingMetrics) {
                    this.counters.set(value, existingMetrics);
                }
            }
        });
        // in addition to the enum counters, add a few more custom counters
        // version, http_request_duration_ms, http_requests_total
        try {
            const versionGaugeCounter = new prom_client_1.default.Gauge({
                name: 'accelance_version_info',
                help: 'Accelance version info.',
                labelNames: ['version'],
                registers: [this.register] // Explicitly set the registry
            });
            const { version } = await (0, accelance_components_1.getVersion)();
            versionGaugeCounter.set({ version: 'v' + version }, 1);
            this.counters.set('accelance_version', versionGaugeCounter);
        }
        catch (error) {
            // If metric already exists, get it from the registry
            const existingMetric = this.register.getSingleMetric('accelance_version');
            if (existingMetric) {
                this.counters.set('accelance_version', existingMetric);
            }
        }
        try {
            this.httpRequestDurationMicroseconds = new prom_client_1.default.Histogram({
                name: 'http_request_duration_ms',
                help: 'Duration of HTTP requests in ms',
                labelNames: ['method', 'route', 'code'],
                buckets: [1, 5, 15, 50, 100, 200, 300, 400, 500], // buckets for response time from 0.1ms to 500ms
                registers: [this.register] // Explicitly set the registry
            });
            this.counters.set('http_request_duration_ms', this.httpRequestDurationMicroseconds);
        }
        catch (error) {
            // If metric already exists, get it from the registry
            const existingMetric = this.register.getSingleMetric('http_request_duration_ms');
            if (existingMetric) {
                this.httpRequestDurationMicroseconds = existingMetric;
                this.counters.set('http_request_duration_ms', this.httpRequestDurationMicroseconds);
            }
        }
        try {
            this.requestCounter = new prom_client_1.Counter({
                name: 'http_requests_total',
                help: 'Total number of HTTP requests',
                labelNames: ['method', 'path', 'status'],
                registers: [this.register] // Explicitly set the registry
            });
            this.counters.set('http_requests_total', this.requestCounter);
        }
        catch (error) {
            // If metric already exists, get it from the registry
            const existingMetric = this.register.getSingleMetric('http_requests_total');
            if (existingMetric) {
                this.requestCounter = existingMetric;
                this.counters.set('http_requests_total', this.requestCounter);
            }
        }
        // Only register metrics that aren't already in the registry
        this.registerMetrics();
        await this.setupMetricsEndpoint();
    }
    async setupMetricsEndpoint() {
        // Add Prometheus middleware to the app
        this.app.use('/api/metrics', async (req, res) => {
            res.set('Content-Type', this.register.contentType);
            const currentMetrics = await this.register.metrics();
            res.send(currentMetrics).end();
        });
        // Runs before each requests
        this.app.use((req, res, next) => {
            res.locals.startEpoch = Date.now();
            next();
        });
        // Runs after each requests
        this.app.use((req, res, next) => {
            res.on('finish', async () => {
                if (res.locals.startEpoch) {
                    this.requestCounter.inc();
                    const responseTimeInMs = Date.now() - res.locals.startEpoch;
                    this.httpRequestDurationMicroseconds
                        .labels(req.method, req.baseUrl, res.statusCode.toString())
                        .observe(responseTimeInMs);
                }
            });
            next();
        });
    }
    incrementCounter(counter, payload) {
        // increment the counter with the payload
        if (this.counters.has(counter)) {
            ;
            this.counters.get(counter).labels(payload).inc();
        }
    }
    registerMetrics() {
        if (process.env.METRICS_INCLUDE_NODE_METRICS !== 'false') {
            // Clear any existing default metrics to avoid conflicts
            prom_client_1.default.register.clear();
            // enable default metrics like CPU usage, memory usage, etc.
            // and ensure they're only registered with our custom registry
            prom_client_1.default.collectDefaultMetrics({
                register: this.register,
                prefix: 'accelance_' // Add a prefix to avoid conflicts
            });
        }
        // Add only the custom metrics that haven't been registered yet
        for (const counter of this.counters.values()) {
            try {
                // Type assertion to access the name property
                const metricName = counter.name;
                if (!this.register.getSingleMetric(metricName)) {
                    this.register.registerMetric(counter);
                }
            }
            catch (error) {
                // If we can't register the metric, it probably already exists
                // Just continue with the next one
            }
        }
    }
}
exports.Prometheus = Prometheus;
//# sourceMappingURL=Prometheus.js.map