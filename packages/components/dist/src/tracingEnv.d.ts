import { ICommonObject } from './Interface';
export interface TracingEnvProvider {
    name: string;
    getEnvConfig: () => ICommonObject | undefined;
    /**
     * Map env config to the `(providerConfig, credentialData)` pair the UI-driven analytics loop
     * consumes, so env-var and UI sources flow through the same code path — no duplicate client
     * construction.
     */
    buildProviderEntry: (cfg: ICommonObject) => {
        providerConfig: ICommonObject;
        credentialData: ICommonObject;
    };
}
/** @internal Test-only: drop cached env-var tracing configs so a subsequent call re-reads env. */
export declare const resetTracingEnvCache: () => void;
/**
 * Reads LangSmith env vars (both new `LANGSMITH_*` and legacy `LANGCHAIN_*` prefixes).
 * Returns a config object if tracing is enabled and an API key is present; otherwise undefined.
 *
 * Side effect: on a successful read, the four LangChain tracing-flag env vars are deleted from
 * `process.env`. Flowise owns tracing emission from this point on; leaving the flags set would let
 * LangChain's auto-tracer fire on every `.invoke()`/`.call()` and produce orphan top-level runs
 * next to the manually-emitted parent/child RunTree.
 */
export declare const getLangSmithEnvConfig: () => {
    apiKey: string;
    endpoint?: string;
    projectName?: string;
} | undefined;
export declare const TRACING_ENV_PROVIDERS: TracingEnvProvider[];
export declare const tracingEnvEnabled: () => boolean;
/**
 * Merge env-var-enabled tracing providers into the analytic map. UI config wins when both sources
 * activate the same provider. Returns a credentialData map for env-injected providers so the loop
 * can skip DB credential loading for those entries.
 */
export declare const applyEnvTracingProviders: (analytic: Record<string, any>) => {
    analytic: Record<string, any>;
    envCredentials: Record<string, ICommonObject>;
};
