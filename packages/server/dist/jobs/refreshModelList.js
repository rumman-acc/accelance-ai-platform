"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshModelList = refreshModelList;
exports.registerModelRefreshJob = registerModelRefreshJob;
exports.stopModelRefreshJob = stopModelRefreshJob;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const node_cron_1 = __importDefault(require("node-cron"));
const openai_1 = __importDefault(require("openai"));
const accelance_components_1 = require("accelance-components");
const logger_1 = __importDefault(require("../utils/logger"));
// Node names in models.json that should be refreshed from each provider's live "list models" API.
// Both the LangChain and LlamaIndex node variants share the same underlying model catalog.
const PROVIDER_NODE_TARGETS = {
    openai: ['chatOpenAI', 'chatOpenAI_LlamaIndex'],
    anthropic: ['chatAnthropic', 'chatAnthropic_LlamaIndex'],
    gemini: ['chatGoogleGenerativeAI']
};
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
];
async function fetchOpenAIModelIds() {
    const apiKey = process.env.MODEL_REFRESH_OPENAI_API_KEY;
    if (!apiKey)
        return null;
    try {
        const client = new openai_1.default({ apiKey });
        const list = await client.models.list();
        return list.data.map((m) => m.id).filter((id) => !OPENAI_NON_CHAT_PREFIXES.some((prefix) => id.startsWith(prefix)));
    }
    catch (error) {
        logger_1.default.error(`[refreshModelList] OpenAI model fetch failed: ${error instanceof Error ? error.message : error}`);
        return null;
    }
}
async function fetchAnthropicModelIds() {
    const apiKey = process.env.MODEL_REFRESH_ANTHROPIC_API_KEY;
    if (!apiKey)
        return null;
    try {
        const res = await axios_1.default.get('https://api.anthropic.com/v1/models', {
            headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
        });
        return (res.data?.data || []).map((m) => m.id).filter(Boolean);
    }
    catch (error) {
        logger_1.default.error(`[refreshModelList] Anthropic model fetch failed: ${error instanceof Error ? error.message : error}`);
        return null;
    }
}
async function fetchGeminiModelIds() {
    const apiKey = process.env.MODEL_REFRESH_GOOGLE_API_KEY;
    if (!apiKey)
        return null;
    try {
        const res = await axios_1.default.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        return (res.data?.models || [])
            .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
            .map((m) => String(m.name || '').replace(/^models\//, ''))
            .filter(Boolean);
    }
    catch (error) {
        logger_1.default.error(`[refreshModelList] Gemini model fetch failed: ${error instanceof Error ? error.message : error}`);
        return null;
    }
}
async function getBaselineModelsFile() {
    const cachePath = (0, accelance_components_1.getModelsCachePath)();
    if (fs_1.default.existsSync(cachePath)) {
        try {
            return JSON.parse(await fs_1.default.promises.readFile(cachePath, 'utf8'));
        }
        catch (error) {
            logger_1.default.warn(`[refreshModelList] Existing cache is corrupt, rebuilding from bundled models.json: ${error}`);
        }
    }
    const bundledPath = (0, accelance_components_1.getModelsJSONPath)();
    if (bundledPath && fs_1.default.existsSync(bundledPath)) {
        return JSON.parse(await fs_1.default.promises.readFile(bundledPath, 'utf8'));
    }
    return {};
}
// Replaces a provider's model list with exactly what's live today, carrying forward cost data
// for models that already have it. Models the provider no longer serves are dropped; brand-new
// models get added with cost left unset (never a guessed price) and a warning logged.
function mergeProviderModels(modelsFile, category, nodeNames, liveIds) {
    const categoryEntries = modelsFile[category];
    if (!Array.isArray(categoryEntries))
        return;
    for (const nodeName of nodeNames) {
        const entry = categoryEntries.find((p) => p.name === nodeName);
        if (!entry || !Array.isArray(entry.models))
            continue;
        const existingByName = new Map(entry.models.map((m) => [m.name, m]));
        entry.models = liveIds.map((id) => {
            const existing = existingByName.get(id);
            if (existing)
                return existing;
            logger_1.default.warn(`[refreshModelList] New model ${nodeName}/${id} has no known pricing - added with cost left unset`);
            return { label: id, name: id, input_cost: null, output_cost: null };
        });
    }
}
async function refreshModelList() {
    const modelsFile = await getBaselineModelsFile();
    let refreshedAny = false;
    const fetchers = [
        ['openai', fetchOpenAIModelIds],
        ['anthropic', fetchAnthropicModelIds],
        ['gemini', fetchGeminiModelIds]
    ];
    for (const [provider, fetchIds] of fetchers) {
        const liveIds = await fetchIds();
        if (liveIds && liveIds.length > 0) {
            mergeProviderModels(modelsFile, 'chat', PROVIDER_NODE_TARGETS[provider], liveIds);
            refreshedAny = true;
            logger_1.default.info(`[refreshModelList] ${provider}: refreshed ${liveIds.length} models`);
        }
    }
    if (!refreshedAny) {
        logger_1.default.warn('[refreshModelList] No providers were refreshed (missing MODEL_REFRESH_*_API_KEY env vars or all fetches failed) - cache left untouched');
        return;
    }
    await fs_1.default.promises.writeFile((0, accelance_components_1.getModelsCachePath)(), JSON.stringify(modelsFile, null, 2), 'utf8');
    logger_1.default.info('[refreshModelList] Model list cache refreshed successfully');
}
let scheduledTask;
// Registers the daily model-list refresh. Independent of ScheduleBeat, which is built around
// user-defined ScheduleRecord rows, not internal maintenance jobs. Runs once at startup too, so
// a fresh deploy doesn't wait 24h for current data.
function registerModelRefreshJob() {
    if (process.env.MODEL_REFRESH_ENABLED === 'false') {
        logger_1.default.info('[refreshModelList] Disabled via MODEL_REFRESH_ENABLED=false');
        return;
    }
    refreshModelList().catch((error) => logger_1.default.error(`[refreshModelList] Startup run failed: ${error}`));
    scheduledTask = node_cron_1.default.schedule('0 3 * * *', () => {
        refreshModelList().catch((error) => logger_1.default.error(`[refreshModelList] Scheduled run failed: ${error}`));
    });
}
function stopModelRefreshJob() {
    scheduledTask?.stop();
    scheduledTask = undefined;
}
//# sourceMappingURL=refreshModelList.js.map