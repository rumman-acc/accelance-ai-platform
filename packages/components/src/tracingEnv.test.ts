import {
    getLangFuseEnvConfig,
    getLangSmithEnvConfig,
    resetTracingEnvCache,
    TRACING_ENV_PROVIDERS,
    tracingEnvEnabled,
    applyEnvTracingProviders
} from './tracingEnv'

const ENV_KEYS = [
    'LANGSMITH_TRACING',
    'LANGCHAIN_TRACING_V2',
    'LANGSMITH_API_KEY',
    'LANGCHAIN_API_KEY',
    'LANGSMITH_ENDPOINT',
    'LANGCHAIN_ENDPOINT',
    'LANGSMITH_PROJECT',
    'LANGCHAIN_PROJECT',
    'LANGFUSE_SECRET_KEY',
    'LANGFUSE_PUBLIC_KEY',
    'LANGFUSE_BASE_URL',
    'LANGFUSE_RELEASE'
] as const

const clearEnv = () => {
    for (const k of ENV_KEYS) delete process.env[k]
}

let envSnapshot: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>

beforeEach(() => {
    envSnapshot = {}
    for (const k of ENV_KEYS) envSnapshot[k] = process.env[k]
    clearEnv()
    resetTracingEnvCache()
})

afterEach(() => {
    clearEnv()
    for (const k of ENV_KEYS) {
        const v = envSnapshot[k]
        if (v !== undefined) process.env[k] = v
    }
    resetTracingEnvCache()
})

describe('getLangSmithEnvConfig', () => {
    it('returns undefined when no tracing flag is set', () => {
        expect(getLangSmithEnvConfig()).toBeUndefined()
    })

    it("returns undefined when tracing flag is not exactly 'true'", () => {
        process.env.LANGSMITH_TRACING = 'false'
        process.env.LANGSMITH_API_KEY = 'k'
        expect(getLangSmithEnvConfig()).toBeUndefined()

        process.env.LANGSMITH_TRACING = '1'
        expect(getLangSmithEnvConfig()).toBeUndefined()

        process.env.LANGSMITH_TRACING = 'TRUE'
        expect(getLangSmithEnvConfig()).toBeUndefined()
    })

    it('returns undefined when tracing flag is true but no api key is set', () => {
        process.env.LANGSMITH_TRACING = 'true'
        expect(getLangSmithEnvConfig()).toBeUndefined()
    })

    it('returns config with only apiKey when flag + new key are set', () => {
        process.env.LANGSMITH_TRACING = 'true'
        process.env.LANGSMITH_API_KEY = 'new-key'
        expect(getLangSmithEnvConfig()).toEqual({
            apiKey: 'new-key',
            endpoint: undefined,
            projectName: undefined
        })
    })

    it('honors legacy LANGCHAIN_* vars alone', () => {
        process.env.LANGCHAIN_TRACING_V2 = 'true'
        process.env.LANGCHAIN_API_KEY = 'legacy-key'
        process.env.LANGCHAIN_ENDPOINT = 'https://legacy.example.com'
        process.env.LANGCHAIN_PROJECT = 'legacy-proj'
        expect(getLangSmithEnvConfig()).toEqual({
            apiKey: 'legacy-key',
            endpoint: 'https://legacy.example.com',
            projectName: 'legacy-proj'
        })
    })

    it('prefers new LANGSMITH_* vars over legacy LANGCHAIN_* when both are set', () => {
        process.env.LANGSMITH_TRACING = 'true'
        process.env.LANGCHAIN_TRACING_V2 = 'true'
        process.env.LANGSMITH_API_KEY = 'new-key'
        process.env.LANGCHAIN_API_KEY = 'legacy-key'
        process.env.LANGSMITH_ENDPOINT = 'https://new.example.com'
        process.env.LANGCHAIN_ENDPOINT = 'https://legacy.example.com'
        process.env.LANGSMITH_PROJECT = 'new-proj'
        process.env.LANGCHAIN_PROJECT = 'legacy-proj'
        expect(getLangSmithEnvConfig()).toEqual({
            apiKey: 'new-key',
            endpoint: 'https://new.example.com',
            projectName: 'new-proj'
        })
    })

    it('falls back to legacy api key when only new tracing flag is set without new api key', () => {
        process.env.LANGSMITH_TRACING = 'true'
        process.env.LANGCHAIN_API_KEY = 'legacy-key'
        expect(getLangSmithEnvConfig()).toEqual({
            apiKey: 'legacy-key',
            endpoint: undefined,
            projectName: undefined
        })
    })

    it('includes endpoint and projectName when provided via new vars', () => {
        process.env.LANGSMITH_TRACING = 'true'
        process.env.LANGSMITH_API_KEY = 'k'
        process.env.LANGSMITH_ENDPOINT = 'https://api.smith.langchain.com'
        process.env.LANGSMITH_PROJECT = 'my-proj'
        expect(getLangSmithEnvConfig()).toEqual({
            apiKey: 'k',
            endpoint: 'https://api.smith.langchain.com',
            projectName: 'my-proj'
        })
    })
})

describe('getLangFuseEnvConfig', () => {
    it('returns undefined when no keys are set', () => {
        expect(getLangFuseEnvConfig()).toBeUndefined()
    })

    it('returns undefined when only one key is set', () => {
        process.env.LANGFUSE_SECRET_KEY = 'sk'
        expect(getLangFuseEnvConfig()).toBeUndefined()

        clearEnv()
        resetTracingEnvCache()
        process.env.LANGFUSE_PUBLIC_KEY = 'pk'
        expect(getLangFuseEnvConfig()).toBeUndefined()
    })

    it('returns config when both keys are set', () => {
        process.env.LANGFUSE_SECRET_KEY = 'sk'
        process.env.LANGFUSE_PUBLIC_KEY = 'pk'
        process.env.LANGFUSE_BASE_URL = 'https://cloud.langfuse.com'
        process.env.LANGFUSE_RELEASE = 'v1'

        expect(getLangFuseEnvConfig()).toEqual({
            secretKey: 'sk',
            publicKey: 'pk',
            baseUrl: 'https://cloud.langfuse.com',
            release: 'v1'
        })
    })
})

describe('memoized getEnvConfig via TRACING_ENV_PROVIDERS', () => {
    const langSmith = TRACING_ENV_PROVIDERS.find((p) => p.name === 'langSmith')!
    const langFuse = TRACING_ENV_PROVIDERS.find((p) => p.name === 'langFuse')!

    it('caches the resolved config across calls', () => {
        process.env.LANGSMITH_TRACING = 'true'
        process.env.LANGSMITH_API_KEY = 'k1'
        const first = langSmith.getEnvConfig()
        expect(first).toMatchObject({ apiKey: 'k1' })

        // Mutating env after cache should not affect subsequent reads.
        process.env.LANGSMITH_API_KEY = 'k2'
        const second = langSmith.getEnvConfig()
        expect(second).toMatchObject({ apiKey: 'k1' })
    })

    it('caches undefined results too', () => {
        expect(langSmith.getEnvConfig()).toBeUndefined()

        // Even after enabling env, the cached undefined sticks until reset.
        process.env.LANGSMITH_TRACING = 'true'
        process.env.LANGSMITH_API_KEY = 'k'
        expect(langSmith.getEnvConfig()).toBeUndefined()
    })

    it('resetTracingEnvCache forces re-read of env on the next call', () => {
        expect(langSmith.getEnvConfig()).toBeUndefined()

        process.env.LANGSMITH_TRACING = 'true'
        process.env.LANGSMITH_API_KEY = 'k'
        resetTracingEnvCache()
        expect(langSmith.getEnvConfig()).toMatchObject({ apiKey: 'k' })

        clearEnv()
        resetTracingEnvCache()
        expect(langSmith.getEnvConfig()).toBeUndefined()
    })

    it('caches Langfuse config across calls too', () => {
        process.env.LANGFUSE_SECRET_KEY = 'sk-1'
        process.env.LANGFUSE_PUBLIC_KEY = 'pk-1'
        const first = langFuse.getEnvConfig()
        expect(first).toMatchObject({ secretKey: 'sk-1', publicKey: 'pk-1' })

        process.env.LANGFUSE_SECRET_KEY = 'sk-2'
        const second = langFuse.getEnvConfig()
        expect(second).toMatchObject({ secretKey: 'sk-1', publicKey: 'pk-1' })
    })
})

describe('TRACING_ENV_PROVIDERS langSmith.buildProviderEntry', () => {
    const langSmith = TRACING_ENV_PROVIDERS.find((p) => p.name === 'langSmith')!

    it('returns full provider entry when endpoint and projectName are present', () => {
        const entry = langSmith.buildProviderEntry({
            apiKey: 'k',
            endpoint: 'https://e.example.com',
            projectName: 'proj-x'
        })
        expect(entry).toEqual({
            providerConfig: { projectName: 'proj-x', status: true },
            credentialData: {
                langSmithApiKey: 'k',
                langSmithEndpoint: 'https://e.example.com'
            }
        })
    })

    it("defaults projectName to 'default' and omits langSmithEndpoint when endpoint is missing", () => {
        const entry = langSmith.buildProviderEntry({ apiKey: 'k' })
        expect(entry).toEqual({
            providerConfig: { projectName: 'default', status: true },
            credentialData: { langSmithApiKey: 'k' }
        })
        expect(entry.credentialData).not.toHaveProperty('langSmithEndpoint')
    })
})

describe('TRACING_ENV_PROVIDERS langFuse.buildProviderEntry', () => {
    const langFuse = TRACING_ENV_PROVIDERS.find((p) => p.name === 'langFuse')!

    it('returns full provider entry when endpoint and release are present', () => {
        const entry = langFuse.buildProviderEntry({
            secretKey: 'sk',
            publicKey: 'pk',
            baseUrl: 'https://cloud.langfuse.com',
            release: '2026.08.11'
        })
        expect(entry).toEqual({
            providerConfig: { release: '2026.08.11', status: true },
            credentialData: {
                langFuseSecretKey: 'sk',
                langFusePublicKey: 'pk',
                langFuseEndpoint: 'https://cloud.langfuse.com'
            }
        })
    })

    it('omits optional endpoint and release when missing', () => {
        const entry = langFuse.buildProviderEntry({ secretKey: 'sk', publicKey: 'pk' })
        expect(entry).toEqual({
            providerConfig: { status: true },
            credentialData: {
                langFuseSecretKey: 'sk',
                langFusePublicKey: 'pk'
            }
        })
    })
})

describe('tracingEnvEnabled', () => {
    it('returns false when no tracing env is configured', () => {
        expect(tracingEnvEnabled()).toBe(false)
    })

    it('returns true when LangSmith tracing env is configured', () => {
        process.env.LANGSMITH_TRACING = 'true'
        process.env.LANGSMITH_API_KEY = 'k'
        expect(tracingEnvEnabled()).toBe(true)
    })

    it('returns true when Langfuse env is configured', () => {
        process.env.LANGFUSE_SECRET_KEY = 'sk'
        process.env.LANGFUSE_PUBLIC_KEY = 'pk'
        expect(tracingEnvEnabled()).toBe(true)
    })
})

describe('applyEnvTracingProviders', () => {
    it('returns the analytic map unchanged with empty envCredentials when no env is set', () => {
        const analytic = { other: { status: true } }
        const result = applyEnvTracingProviders(analytic)
        expect(result.analytic).toEqual({ other: { status: true } })
        expect(result.envCredentials).toEqual({})
    })

    it('injects provider config and credentials when env is set and analytic has no entry', () => {
        process.env.LANGSMITH_TRACING = 'true'
        process.env.LANGSMITH_API_KEY = 'k'
        process.env.LANGSMITH_ENDPOINT = 'https://e.example.com'
        process.env.LANGSMITH_PROJECT = 'proj'

        const analytic: Record<string, any> = {}
        const result = applyEnvTracingProviders(analytic)

        expect(result.analytic.langSmith).toEqual({
            projectName: 'proj',
            status: true
        })
        expect(result.envCredentials).toEqual({
            langSmith: {
                langSmithApiKey: 'k',
                langSmithEndpoint: 'https://e.example.com'
            }
        })
    })

    it('injects Langfuse provider config and credentials when env is set and analytic has no entry', () => {
        process.env.LANGFUSE_SECRET_KEY = 'sk'
        process.env.LANGFUSE_PUBLIC_KEY = 'pk'
        process.env.LANGFUSE_BASE_URL = 'https://cloud.langfuse.com'
        process.env.LANGFUSE_RELEASE = 'global-release'

        const analytic: Record<string, any> = {}
        const result = applyEnvTracingProviders(analytic)

        expect(result.analytic.langFuse).toEqual({
            release: 'global-release',
            status: true
        })
        expect(result.envCredentials.langFuse).toEqual({
            langFuseSecretKey: 'sk',
            langFusePublicKey: 'pk',
            langFuseEndpoint: 'https://cloud.langfuse.com'
        })
    })

    it('skips env injection when UI analytic entry already has status === true', () => {
        process.env.LANGSMITH_TRACING = 'true'
        process.env.LANGSMITH_API_KEY = 'env-key'

        const uiEntry = { projectName: 'ui-proj', status: true }
        const analytic: Record<string, any> = { langSmith: uiEntry }
        const result = applyEnvTracingProviders(analytic)

        expect(result.analytic.langSmith).toBe(uiEntry)
        expect(result.envCredentials).toEqual({})
    })

    it('applies env when UI entry exists but status is not true', () => {
        process.env.LANGSMITH_TRACING = 'true'
        process.env.LANGSMITH_API_KEY = 'env-key'

        const analytic: Record<string, any> = { langSmith: { projectName: 'ui-proj', status: false } }
        const result = applyEnvTracingProviders(analytic)

        expect(result.analytic.langSmith).toEqual({
            projectName: 'default',
            status: true
        })
        expect(result.envCredentials.langSmith).toEqual({ langSmithApiKey: 'env-key' })
    })

    it('does not mutate the passed-in analytic object', () => {
        process.env.LANGSMITH_TRACING = 'true'
        process.env.LANGSMITH_API_KEY = 'k'

        const analytic: Record<string, any> = {}
        const result = applyEnvTracingProviders(analytic)

        expect(result.analytic).not.toBe(analytic)
        expect(analytic.langSmith).toBeUndefined()
        expect(result.analytic.langSmith).toBeDefined()
    })
})
