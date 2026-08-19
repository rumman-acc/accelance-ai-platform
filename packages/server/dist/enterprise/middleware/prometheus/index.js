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
exports.initializePrometheus = void 0;
const prom_client_1 = __importStar(require("prom-client"));
const initializePrometheus = (app) => {
    const register = new prom_client_1.default.Registry();
    register.setDefaultLabels({
        app: 'Accelance'
    });
    const predictionsTotal = new prom_client_1.default.Counter({
        name: 'checkouts_total',
        help: 'Total number of checkouts',
        labelNames: ['payment_method']
    });
    const requestCounter = new prom_client_1.Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'path', 'status']
    });
    app.use('/api/prediction', async (req, res) => {
        res.on('finish', async () => {
            requestCounter.labels(req?.method, req?.path, res.statusCode.toString()).inc();
            predictionsTotal.labels('success').inc();
        });
    });
    // enable default metrics like CPU usage, memory usage, etc.
    prom_client_1.default.collectDefaultMetrics({ register });
    // Add our custom metric to the registry
    register.registerMetric(requestCounter);
    register.registerMetric(predictionsTotal);
    // Add Prometheus middleware to the app
    app.use('/api/metrics', async (req, res) => {
        res.set('Content-Type', register.contentType);
        const currentMetrics = await register.metrics();
        res.send(currentMetrics);
    });
    const httpRequestDurationMicroseconds = new prom_client_1.default.Histogram({
        name: 'http_request_duration_ms',
        help: 'Duration of HTTP requests in ms',
        labelNames: ['method', 'route', 'code'],
        buckets: [1, 5, 15, 50, 100, 200, 300, 400, 500] // buckets for response time from 0.1ms to 500ms
    });
    register.registerMetric(httpRequestDurationMicroseconds);
    // Runs before each requests
    app.use((req, res, next) => {
        res.locals.startEpoch = Date.now();
        next();
    });
    // Runs after each requests
    app.use((req, res, next) => {
        res.on('finish', async () => {
            requestCounter.inc();
            const responseTimeInMs = Date.now() - res.locals.startEpoch;
            httpRequestDurationMicroseconds.labels(req.method, req?.route?.path, res.statusCode.toString()).observe(responseTimeInMs);
        });
        next();
    });
};
exports.initializePrometheus = initializePrometheus;
//# sourceMappingURL=index.js.map