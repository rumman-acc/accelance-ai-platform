"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyEnvTracingProviders = exports.tracingEnvEnabled = exports.TRACING_ENV_PROVIDERS = exports.getLangSmithEnvConfig = exports.resetTracingEnvCache = void 0;
const utils_1 = require("./utils");
/**
 * Process-lifetime cache for env-var tracing configs.
 *
 * Entries are populated on first access and never expire — a server restart is
 * required to pick up env-var changes. This is intentional: env vars are set at
 * deploy time and re-reading them on every agent execution would add overhead
 * with no benefit. Use {@link resetTracingEnvCache} (test-only) to clear the
 * cache in unit tests.
 */
const tracingEnvConfigCache = new Map();
const memoizeEnvConfig = (name, resolver) => {
    return () => {
        const cached = tracingEnvConfigCache.get(name);
        if (cached)
            return cached.value;
        const value = resolver();
        tracingEnvConfigCache.set(name, { value });
        return value;
    };
};
/** @internal Test-only: drop cached env-var tracing configs so a subsequent call re-reads env. */
const resetTracingEnvCache = () => {
    tracingEnvConfigCache.clear();
};
exports.resetTracingEnvCache = resetTracingEnvCache;
/**
 * Env var flags that activate LangChain's built-in auto-tracer (see @langchain/core
 * `isTracingEnabled()`). Once Flowise adopts the tracing config, these must be cleared from
 * `process.env` so the auto-tracer doesn't emit duplicate top-level runs alongside Flowise's
 * manual `onLLMStart`/`onToolStart` child RunTrees.
 */
const LANGCHAIN_TRACING_FLAG_VARS = ['LANGSMITH_TRACING', 'LANGCHAIN_TRACING_V2', 'LANGSMITH_TRACING_V2', 'LANGCHAIN_TRACING'];
/**
 * Reads LangSmith env vars (both new `LANGSMITH_*` and legacy `LANGCHAIN_*` prefixes).
 * Returns a config object if tracing is enabled and an API key is present; otherwise undefined.
 *
 * Side effect: on a successful read, the four LangChain tracing-flag env vars are deleted from
 * `process.env`. Flowise owns tracing emission from this point on; leaving the flags set would let
 * LangChain's auto-tracer fire on every `.invoke()`/`.call()` and produce orphan top-level runs
 * next to the manually-emitted parent/child RunTree.
 */
const getLangSmithEnvConfig = () => {
    const tracingFlag = (0, utils_1.getEnvironmentVariable)('LANGSMITH_TRACING') ?? (0, utils_1.getEnvironmentVariable)('LANGCHAIN_TRACING_V2');
    if (tracingFlag !== 'true')
        return undefined;
    const apiKey = (0, utils_1.getEnvironmentVariable)('LANGSMITH_API_KEY') ?? (0, utils_1.getEnvironmentVariable)('LANGCHAIN_API_KEY');
    if (!apiKey)
        return undefined;
    const endpoint = (0, utils_1.getEnvironmentVariable)('LANGSMITH_ENDPOINT') ?? (0, utils_1.getEnvironmentVariable)('LANGCHAIN_ENDPOINT');
    const projectName = (0, utils_1.getEnvironmentVariable)('LANGSMITH_PROJECT') ?? (0, utils_1.getEnvironmentVariable)('LANGCHAIN_PROJECT');
    // the four LangChain tracing-flag env vars are deleted from `process.env`. Flowise owns tracing
    // emission from this point on; leaving the flags set would letLangChain's auto-tracer fire on
    // every `.invoke()`/`.call()` and produce orphan top-level runs next to the manually-emitted
    // parent/child RunTree.
    for (const k of LANGCHAIN_TRACING_FLAG_VARS)
        delete process.env[k];
    return { apiKey, endpoint, projectName };
};
exports.getLangSmithEnvConfig = getLangSmithEnvConfig;
exports.TRACING_ENV_PROVIDERS = [
    {
        name: 'langSmith',
        getEnvConfig: memoizeEnvConfig('langSmith', exports.getLangSmithEnvConfig),
        buildProviderEntry: (cfg) => ({
            providerConfig: { projectName: cfg.projectName ?? 'default', status: true },
            credentialData: {
                langSmithApiKey: cfg.apiKey,
                ...(cfg.endpoint ? { langSmithEndpoint: cfg.endpoint } : {})
            }
        })
    }
];
const tracingEnvEnabled = () => exports.TRACING_ENV_PROVIDERS.some((p) => p.getEnvConfig() !== undefined);
exports.tracingEnvEnabled = tracingEnvEnabled;
/**
 * Merge env-var-enabled tracing providers into the analytic map. UI config wins when both sources
 * activate the same provider. Returns a credentialData map for env-injected providers so the loop
 * can skip DB credential loading for those entries.
 */
const applyEnvTracingProviders = (analytic) => {
    const envCredentials = {};
    const newEntries = {};
    for (const p of exports.TRACING_ENV_PROVIDERS) {
        const cfg = p.getEnvConfig();
        if (!cfg)
            continue;
        if (analytic[p.name]?.status === true)
            continue;
        const { providerConfig, credentialData } = p.buildProviderEntry(cfg);
        newEntries[p.name] = providerConfig;
        envCredentials[p.name] = credentialData;
    }
    return { analytic: { ...analytic, ...newEntries }, envCredentials };
};
exports.applyEnvTracingProviders = applyEnvTracingProviders;
//# sourceMappingURL=tracingEnv.js.map