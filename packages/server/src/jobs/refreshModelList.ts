import axios from 'axios'
import fs from 'fs'
import cron, { ScheduledTask } from 'node-cron'
import OpenAI from 'openai'
import { getModelsCachePath, getModelsJSONPath } from 'accelance-components'
import logger from '../utils/logger'

// Node names in models.json that should be refreshed from each provider's live "list models" API.
// Both the LangChain and LlamaIndex node variants share the same underlying model catalog.
const PROVIDER_NODE_TARGETS: Record<string, string[]> = {
    openai: ['chatOpenAI', 'chatOpenAI_LlamaIndex'],
    anthropic: ['chatAnthropic', 'chatAnthropic_LlamaIndex'],
    gemini: ['chatGoogleGenerativeAI']
}

// Non-chat OpenAI models (embeddings, audio, image, moderation) that /v1/models also returns -
// OpenAI's API doesn't expose a capability filter, so this is a best-effort exclude list.
const OPENAI_NON_CHAT_PREFIXES = [
    'whisper',
    'tts-',
    'dall-e',
    'text-embedding',
    'text-moderation',
    'omni-moderation',
    'babbage',
    'davinci',
    'text-davinci'
]

async function fetchOpenAIModelIds(): Promise<string[] | null> {
    const apiKey = process.env.MODEL_REFRESH_OPENAI_API_KEY
    if (!apiKey) return null
    try {
        const client = new OpenAI({ apiKey })
        const list = await client.models.list()
        return list.data.map((m) => m.id).filter((id) => !OPENAI_NON_CHAT_PREFIXES.some((prefix) => id.startsWith(prefix)))
    } catch (error) {
        logger.error(`[refreshModelList] OpenAI model fetch failed: ${error instanceof Error ? error.message : error}`)
        return null
    }
}

async function fetchAnthropicModelIds(): Promise<string[] | null> {
    const apiKey = process.env.MODEL_REFRESH_ANTHROPIC_API_KEY
    if (!apiKey) return null
    try {
        const res = await axios.get('https://api.anthropic.com/v1/models', {
            headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
        })
        return (res.data?.data || []).map((m: any) => m.id).filter(Boolean)
    } catch (error) {
        logger.error(`[refreshModelList] Anthropic model fetch failed: ${error instanceof Error ? error.message : error}`)
        return null
    }
}

async function fetchGeminiModelIds(): Promise<string[] | null> {
    const apiKey = process.env.MODEL_REFRESH_GOOGLE_API_KEY
    if (!apiKey) return null
    try {
        const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
        return (res.data?.models || [])
            .filter((m: any) => (m.supportedGenerationMethods || []).includes('generateContent'))
            .map((m: any) => String(m.name || '').replace(/^models\//, ''))
            .filter(Boolean)
    } catch (error) {
        logger.error(`[refreshModelList] Gemini model fetch failed: ${error instanceof Error ? error.message : error}`)
        return null
    }
}

async function getBaselineModelsFile(): Promise<any> {
    const cachePath = getModelsCachePath()
    if (fs.existsSync(cachePath)) {
        try {
            return JSON.parse(await fs.promises.readFile(cachePath, 'utf8'))
        } catch (error) {
            logger.warn(`[refreshModelList] Existing cache is corrupt, rebuilding from bundled models.json: ${error}`)
        }
    }
    const bundledPath = getModelsJSONPath()
    if (bundledPath && fs.existsSync(bundledPath)) {
        return JSON.parse(await fs.promises.readFile(bundledPath, 'utf8'))
    }
    return {}
}

// Replaces a provider's model list with exactly what's live today, carrying forward cost data
// for models that already have it. Models the provider no longer serves are dropped; brand-new
// models get added with cost left unset (never a guessed price) and a warning logged.
function mergeProviderModels(modelsFile: any, category: string, nodeNames: string[], liveIds: string[]) {
    const categoryEntries = modelsFile[category]
    if (!Array.isArray(categoryEntries)) return
    for (const nodeName of nodeNames) {
        const entry = categoryEntries.find((p: any) => p.name === nodeName)
        if (!entry || !Array.isArray(entry.models)) continue
        const existingByName = new Map(entry.models.map((m: any) => [m.name, m]))
        entry.models = liveIds.map((id) => {
            const existing = existingByName.get(id)
            if (existing) return existing
            logger.warn(`[refreshModelList] New model ${nodeName}/${id} has no known pricing - added with cost left unset`)
            return { label: id, name: id, input_cost: null, output_cost: null }
        })
    }
}

export async function refreshModelList(): Promise<void> {
    const modelsFile = await getBaselineModelsFile()
    let refreshedAny = false

    const fetchers: Array<[keyof typeof PROVIDER_NODE_TARGETS, () => Promise<string[] | null>]> = [
        ['openai', fetchOpenAIModelIds],
        ['anthropic', fetchAnthropicModelIds],
        ['gemini', fetchGeminiModelIds]
    ]

    for (const [provider, fetchIds] of fetchers) {
        const liveIds = await fetchIds()
        if (liveIds && liveIds.length > 0) {
            mergeProviderModels(modelsFile, 'chat', PROVIDER_NODE_TARGETS[provider], liveIds)
            refreshedAny = true
            logger.info(`[refreshModelList] ${provider}: refreshed ${liveIds.length} models`)
        }
    }

    if (!refreshedAny) {
        logger.warn(
            '[refreshModelList] No providers were refreshed (missing MODEL_REFRESH_*_API_KEY env vars or all fetches failed) - cache left untouched'
        )
        return
    }

    await fs.promises.writeFile(getModelsCachePath(), JSON.stringify(modelsFile, null, 2), 'utf8')
    logger.info('[refreshModelList] Model list cache refreshed successfully')
}

let scheduledTask: ScheduledTask | undefined

// Registers the daily model-list refresh. Independent of ScheduleBeat, which is built around
// user-defined ScheduleRecord rows, not internal maintenance jobs. Runs once at startup too, so
// a fresh deploy doesn't wait 24h for current data.
export function registerModelRefreshJob(): void {
    if (process.env.MODEL_REFRESH_ENABLED === 'false') {
        logger.info('[refreshModelList] Disabled via MODEL_REFRESH_ENABLED=false')
        return
    }

    refreshModelList().catch((error) => logger.error(`[refreshModelList] Startup run failed: ${error}`))

    scheduledTask = cron.schedule('0 3 * * *', () => {
        refreshModelList().catch((error) => logger.error(`[refreshModelList] Scheduled run failed: ${error}`))
    })
}

export function stopModelRefreshJob(): void {
    scheduledTask?.stop()
    scheduledTask = undefined
}
