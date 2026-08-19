import { IMetricsProvider } from '../Interface.Metrics';
import express from 'express';
export declare class OpenTelemetry implements IMetricsProvider {
    private app;
    private resource;
    private otlpMetricExporter;
    private metricReader;
    private meterProvider;
    private counters;
    private httpRequestCounter;
    private httpRequestDuration;
    constructor(app: express.Application);
    getName(): string;
    initializeCounters(): Promise<void>;
    private recordHttpRequestDuration;
    private recordHttpRequest;
    setupMetricsEndpoint(): Promise<void>;
    incrementCounter(counter: string, payload: any): Promise<void>;
}
