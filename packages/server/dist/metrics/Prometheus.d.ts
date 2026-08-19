import { ACCELANCE_METRIC_COUNTERS, IMetricsProvider } from '../Interface.Metrics';
import express from 'express';
export declare class Prometheus implements IMetricsProvider {
    private app;
    private readonly register;
    private counters;
    private requestCounter;
    private httpRequestDurationMicroseconds;
    constructor(app: express.Application);
    getName(): string;
    initializeCounters(): Promise<void>;
    setupMetricsEndpoint(): Promise<void>;
    incrementCounter(counter: ACCELANCE_METRIC_COUNTERS, payload: any): void;
    private registerMetrics;
}
