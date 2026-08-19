'use strict'
var __createBinding =
    (this && this.__createBinding) ||
    (Object.create
        ? function (o, m, k, k2) {
              if (k2 === undefined) k2 = k
              var desc = Object.getOwnPropertyDescriptor(m, k)
              if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
                  desc = {
                      enumerable: true,
                      get: function () {
                          return m[k]
                      }
                  }
              }
              Object.defineProperty(o, k2, desc)
          }
        : function (o, m, k, k2) {
              if (k2 === undefined) k2 = k
              o[k2] = m[k]
          })
var __setModuleDefault =
    (this && this.__setModuleDefault) ||
    (Object.create
        ? function (o, v) {
              Object.defineProperty(o, 'default', { enumerable: true, value: v })
          }
        : function (o, v) {
              o['default'] = v
          })
var __importStar =
    (this && this.__importStar) ||
    function (mod) {
        if (mod && mod.__esModule) return mod
        var result = {}
        if (mod != null)
            for (var k in mod) if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k)
        __setModuleDefault(result, mod)
        return result
    }
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod }
    }
Object.defineProperty(exports, '__esModule', { value: true })
exports.CustomStreamingHandler =
    exports.AnalyticHandler =
    exports.additionalCallbacks =
    exports.CustomChainHandler =
    exports.ConsoleCallbackHandler =
        void 0
exports.getPhoenixTracer = getPhoenixTracer
exports.tryJsonStringify = tryJsonStringify
exports.elapsed = elapsed
const url_1 = require('url')
const uuid_1 = require('uuid')
const langsmith_1 = require('langsmith')
const langfuse_langchain_1 = __importDefault(require('langfuse-langchain'))
const lunary_1 = __importDefault(require('lunary'))
const langsmith_2 = require('langsmith')
const langfuse_1 = require('langfuse')
const openinference_instrumentation_langchain_1 = require('@arizeai/openinference-instrumentation-langchain')
const grpc_js_1 = require('@grpc/grpc-js')
const api_1 = __importStar(require('@opentelemetry/api'))
const exporter_trace_otlp_grpc_1 = require('@opentelemetry/exporter-trace-otlp-grpc')
const exporter_trace_otlp_proto_1 = require('@opentelemetry/exporter-trace-otlp-proto')
const instrumentation_1 = require('@opentelemetry/instrumentation')
const resources_1 = require('@opentelemetry/resources')
const sdk_trace_base_1 = require('@opentelemetry/sdk-trace-base')
const sdk_trace_node_1 = require('@opentelemetry/sdk-trace-node')
const semantic_conventions_1 = require('@opentelemetry/semantic-conventions')
const base_1 = require('@langchain/core/callbacks/base')
const CallbackManagerModule = __importStar(require('@langchain/core/callbacks/manager'))
const tracer_langchain_1 = require('@langchain/core/tracers/tracer_langchain')
const base_2 = require('@langchain/core/tracers/base')
const lunary_2 = require('@langchain/community/callbacks/handlers/lunary')
const utils_1 = require('./utils')
const tracingEnv_1 = require('./tracingEnv')
const EvaluationRunTracer_1 = require('../evaluation/EvaluationRunTracer')
const EvaluationRunTracerLlama_1 = require('../evaluation/EvaluationRunTracerLlama')
const langwatch_1 = require('langwatch')
function getArizeTracer(options) {
    const SEMRESATTRS_PROJECT_NAME = 'openinference.project.name'
    try {
        const metadata = new grpc_js_1.Metadata()
        metadata.set('api_key', options.apiKey)
        metadata.set('space_id', options.spaceId)
        const traceExporter = new exporter_trace_otlp_grpc_1.OTLPTraceExporter({
            url: `${options.baseUrl}/v1`,
            metadata
        })
        const tracerProvider = new sdk_trace_node_1.NodeTracerProvider({
            resource: new resources_1.Resource({
                [semantic_conventions_1.ATTR_SERVICE_NAME]: options.projectName,
                [semantic_conventions_1.ATTR_SERVICE_VERSION]: '1.0.0',
                [SEMRESATTRS_PROJECT_NAME]: options.projectName,
                model_id: options.projectName
            })
        })
        tracerProvider.addSpanProcessor(new sdk_trace_base_1.SimpleSpanProcessor(traceExporter))
        if (options.enableCallback) {
            ;(0, instrumentation_1.registerInstrumentations)({
                instrumentations: []
            })
            const lcInstrumentation = new openinference_instrumentation_langchain_1.LangChainInstrumentation()
            lcInstrumentation.manuallyInstrument(CallbackManagerModule)
            tracerProvider.register()
        }
        return tracerProvider.getTracer(`arize-tracer-${(0, uuid_1.v4)().toString()}`)
    } catch (err) {
        if (process.env.DEBUG === 'true') console.error(`Error setting up Arize tracer: ${err.message}`)
        return undefined
    }
}
function getPhoenixTracer(options) {
    const SEMRESATTRS_PROJECT_NAME = 'openinference.project.name'
    try {
        const parsedURL = new url_1.URL(options.baseUrl)
        const baseEndpoint = `${parsedURL.protocol}//${parsedURL.host}`
        // Remove trailing slashes
        let path = parsedURL.pathname.replace(/\/$/, '')
        // Remove any existing /v1/traces suffix
        path = path.replace(/\/v1\/traces$/, '')
        const exporterUrl = `${baseEndpoint}${path}/v1/traces`
        const exporterHeaders = {
            api_key: options.apiKey || '',
            authorization: `Bearer ${options.apiKey || ''}`
        }
        const traceExporter = new exporter_trace_otlp_proto_1.OTLPTraceExporter({
            url: exporterUrl,
            headers: exporterHeaders
        })
        const tracerProvider = new sdk_trace_node_1.NodeTracerProvider({
            resource: new resources_1.Resource({
                [semantic_conventions_1.ATTR_SERVICE_NAME]: options.projectName,
                [semantic_conventions_1.ATTR_SERVICE_VERSION]: '1.0.0',
                [SEMRESATTRS_PROJECT_NAME]: options.projectName
            })
        })
        tracerProvider.addSpanProcessor(new sdk_trace_base_1.SimpleSpanProcessor(traceExporter))
        if (options.enableCallback) {
            ;(0, instrumentation_1.registerInstrumentations)({
                instrumentations: []
            })
            const lcInstrumentation = new openinference_instrumentation_langchain_1.LangChainInstrumentation()
            lcInstrumentation.manuallyInstrument(CallbackManagerModule)
            tracerProvider.register()
        }
        return tracerProvider.getTracer(`phoenix-tracer-${(0, uuid_1.v4)().toString()}`)
    } catch (err) {
        if (process.env.DEBUG === 'true') console.error(`Error setting up Phoenix tracer: ${err.message}`)
        return undefined
    }
}
function getOpikTracer(options) {
    const SEMRESATTRS_PROJECT_NAME = 'openinference.project.name'
    try {
        const traceExporter = new exporter_trace_otlp_proto_1.OTLPTraceExporter({
            url: `${options.baseUrl}/v1/private/otel/v1/traces`,
            headers: {
                Authorization: options.apiKey,
                projectName: options.projectName,
                'Comet-Workspace': options.workspace
            }
        })
        const tracerProvider = new sdk_trace_node_1.NodeTracerProvider({
            resource: new resources_1.Resource({
                [semantic_conventions_1.ATTR_SERVICE_NAME]: options.projectName,
                [semantic_conventions_1.ATTR_SERVICE_VERSION]: '1.0.0',
                [SEMRESATTRS_PROJECT_NAME]: options.projectName
            })
        })
        tracerProvider.addSpanProcessor(new sdk_trace_base_1.SimpleSpanProcessor(traceExporter))
        if (options.enableCallback) {
            ;(0, instrumentation_1.registerInstrumentations)({
                instrumentations: []
            })
            const lcInstrumentation = new openinference_instrumentation_langchain_1.LangChainInstrumentation()
            lcInstrumentation.manuallyInstrument(CallbackManagerModule)
            tracerProvider.register()
        }
        return tracerProvider.getTracer(`opik-tracer-${(0, uuid_1.v4)().toString()}`)
    } catch (err) {
        if (process.env.DEBUG === 'true') console.error(`Error setting up Opik tracer: ${err.message}`)
        return undefined
    }
}
function tryGetJsonSpaces() {
    try {
        return parseInt((0, utils_1.getEnvironmentVariable)('LOG_JSON_SPACES') ?? '2')
    } catch (err) {
        return 2
    }
}
function tryJsonStringify(obj, fallback) {
    try {
        return JSON.stringify(obj, null, tryGetJsonSpaces())
    } catch (err) {
        return fallback
    }
}
function elapsed(run) {
    if (!run.end_time) return ''
    const elapsed = run.end_time - run.start_time
    if (elapsed < 1000) {
        return `${elapsed}ms`
    }
    return `${(elapsed / 1000).toFixed(2)}s`
}
class ConsoleCallbackHandler extends base_2.BaseTracer {
    persistRun(_run) {
        return Promise.resolve()
    }
    constructor(logger, orgId) {
        super()
        this.name = 'console_callback_handler'
        this.logger = logger
        this.orgId = orgId
        if ((0, utils_1.getEnvironmentVariable)('DEBUG') === 'true') {
            logger.level = (0, utils_1.getEnvironmentVariable)('LOG_LEVEL') ?? 'info'
        }
    }
    getParents(run) {
        const parents = []
        let currentRun = run
        while (currentRun.parent_run_id) {
            const parent = this.runMap.get(currentRun.parent_run_id)
            if (parent) {
                parents.push(parent)
                currentRun = parent
            } else {
                break
            }
        }
        return parents
    }
    getBreadcrumbs(run) {
        const parents = this.getParents(run).reverse()
        const string = [...parents, run]
            .map((parent) => {
                const name = `${parent.execution_order}:${parent.run_type}:${parent.name}`
                return name
            })
            .join(' > ')
        return string
    }
    onChainStart(run) {
        const crumbs = this.getBreadcrumbs(run)
        this.logger.verbose(
            `[${this.orgId}]: [chain/start] [${crumbs}] Entering Chain run with input: ${tryJsonStringify(run.inputs, '[inputs]')}`
        )
    }
    onChainEnd(run) {
        const crumbs = this.getBreadcrumbs(run)
        this.logger.verbose(
            `[${this.orgId}]: [chain/end] [${crumbs}] [${elapsed(run)}] Exiting Chain run with output: ${tryJsonStringify(
                run.outputs,
                '[outputs]'
            )}`
        )
    }
    onChainError(run) {
        const crumbs = this.getBreadcrumbs(run)
        this.logger.verbose(
            `[${this.orgId}]: [chain/error] [${crumbs}] [${elapsed(run)}] Chain run errored with error: ${tryJsonStringify(
                run.error,
                '[error]'
            )}`
        )
    }
    onLLMStart(run) {
        const crumbs = this.getBreadcrumbs(run)
        const inputs = 'prompts' in run.inputs ? { prompts: run.inputs.prompts.map((p) => p.trim()) } : run.inputs
        this.logger.verbose(`[${this.orgId}]: [llm/start] [${crumbs}] Entering LLM run with input: ${tryJsonStringify(inputs, '[inputs]')}`)
    }
    onLLMEnd(run) {
        const crumbs = this.getBreadcrumbs(run)
        this.logger.verbose(
            `[${this.orgId}]: [llm/end] [${crumbs}] [${elapsed(run)}] Exiting LLM run with output: ${tryJsonStringify(
                run.outputs,
                '[response]'
            )}`
        )
    }
    onLLMError(run) {
        const crumbs = this.getBreadcrumbs(run)
        this.logger.verbose(
            `[${this.orgId}]: [llm/error] [${crumbs}] [${elapsed(run)}] LLM run errored with error: ${tryJsonStringify(
                run.error,
                '[error]'
            )}`
        )
    }
    onToolStart(run) {
        const crumbs = this.getBreadcrumbs(run)
        this.logger.verbose(`[${this.orgId}]: [tool/start] [${crumbs}] Entering Tool run with input: "${run.inputs.input?.trim()}"`)
    }
    onToolEnd(run) {
        const crumbs = this.getBreadcrumbs(run)
        this.logger.verbose(
            `[${this.orgId}]: [tool/end] [${crumbs}] [${elapsed(run)}] Exiting Tool run with output: "${run.outputs?.output?.trim()}"`
        )
    }
    onToolError(run) {
        const crumbs = this.getBreadcrumbs(run)
        this.logger.verbose(
            `[${this.orgId}]: [tool/error] [${crumbs}] [${elapsed(run)}] Tool run errored with error: ${tryJsonStringify(
                run.error,
                '[error]'
            )}`
        )
    }
    onAgentAction(run) {
        const agentRun = run
        const crumbs = this.getBreadcrumbs(run)
        this.logger.verbose(
            `[${this.orgId}]: [agent/action] [${crumbs}] Agent selected action: ${tryJsonStringify(
                agentRun.actions[agentRun.actions.length - 1],
                '[action]'
            )}`
        )
    }
}
exports.ConsoleCallbackHandler = ConsoleCallbackHandler
/**
 * Custom chain handler class
 */
class CustomChainHandler extends base_1.BaseCallbackHandler {
    constructor(sseStreamer, chatId, skipK, returnSourceDocuments) {
        super()
        this.name = 'custom_chain_handler'
        this.isLLMStarted = false
        this.skipK = 0 // Skip streaming for first K numbers of handleLLMStart
        this.returnSourceDocuments = false
        this.cachedResponse = true
        this.chatId = ''
        this.sseStreamer = sseStreamer
        this.chatId = chatId
        this.skipK = skipK ?? this.skipK
        this.returnSourceDocuments = returnSourceDocuments ?? this.returnSourceDocuments
    }
    handleLLMStart() {
        this.cachedResponse = false
        if (this.skipK > 0) this.skipK -= 1
    }
    handleLLMNewToken(token, idx, runId, parentRunId, tags, fields) {
        if (this.skipK === 0) {
            if (!this.isLLMStarted) {
                this.isLLMStarted = true
                if (this.sseStreamer) {
                    this.sseStreamer.streamStartEvent(this.chatId, token)
                }
            }
            if (this.sseStreamer) {
                if (token) {
                    const chunk = fields?.chunk
                    const message = chunk?.message
                    const toolCalls = message?.tool_call_chunks || []
                    // Only stream when token is not empty and not a tool call
                    if (toolCalls.length === 0) {
                        this.sseStreamer.streamTokenEvent(this.chatId, token)
                    }
                }
            }
        }
    }
    handleLLMEnd() {
        if (this.sseStreamer) {
            this.sseStreamer.streamEndEvent(this.chatId)
        }
    }
    handleChainEnd(outputs, _, parentRunId) {
        /*
            Langchain does not call handleLLMStart, handleLLMEnd, handleLLMNewToken when the chain is cached.
            Callback Order is "Chain Start -> LLM Start --> LLM Token --> LLM End -> Chain End" for normal responses.
            Callback Order is "Chain Start -> Chain End" for cached responses.
         */
        if (this.cachedResponse && parentRunId === undefined) {
            const cachedValue = outputs.text || outputs.response || outputs.output || outputs.output_text
            //split at whitespace, and keep the whitespace. This is to preserve the original formatting.
            const result = cachedValue.split(/(\s+)/)
            result.forEach((token, index) => {
                if (index === 0) {
                    if (this.sseStreamer) {
                        this.sseStreamer.streamStartEvent(this.chatId, token)
                    }
                }
                if (this.sseStreamer) {
                    this.sseStreamer.streamTokenEvent(this.chatId, token)
                }
            })
            if (this.returnSourceDocuments && this.sseStreamer) {
                this.sseStreamer.streamSourceDocumentsEvent(this.chatId, outputs?.sourceDocuments)
            }
            if (this.sseStreamer) {
                this.sseStreamer.streamEndEvent(this.chatId)
            }
        } else {
            if (this.returnSourceDocuments && this.sseStreamer) {
                this.sseStreamer.streamSourceDocumentsEvent(this.chatId, outputs?.sourceDocuments)
            }
        }
    }
}
exports.CustomChainHandler = CustomChainHandler
/*TODO - Add llamaIndex tracer to non evaluation runs*/
class ExtendedLunaryHandler extends lunary_2.LunaryHandler {
    constructor({ flowiseOptions, ...options }) {
        super(options)
        this.appDataSource = flowiseOptions.appDataSource
        this.databaseEntities = flowiseOptions.databaseEntities
        this.chatId = flowiseOptions.chatId
        this.apiMessageId = flowiseOptions.apiMessageId
    }
    async initThread() {
        const entity = await this.appDataSource.getRepository(this.databaseEntities['Lead']).findOne({
            where: {
                chatId: this.chatId
            }
        })
        const userId = entity?.email ?? entity?.id
        this.thread = lunary_1.default.openThread({
            id: this.chatId,
            userId,
            userProps: userId
                ? {
                      name: entity?.name ?? undefined,
                      email: entity?.email ?? undefined,
                      phone: entity?.phone ?? undefined
                  }
                : undefined
        })
    }
    async handleChainStart(chain, inputs, runId, parentRunId, tags, metadata) {
        // First chain (no parent run id) is the user message
        if (this.chatId && !parentRunId) {
            if (!this.thread) {
                await this.initThread()
            }
            const messageText = inputs.input || inputs.question
            const messageId = this.thread.trackMessage({
                content: messageText,
                role: 'user'
            })
            // Track top level chain id for knowing when we got the final reply
            this.currentRunId = runId
            // Use the messageId as the parent of the chain for reconciliation
            super.handleChainStart(chain, inputs, runId, messageId, tags, metadata)
        } else {
            super.handleChainStart(chain, inputs, runId, parentRunId, tags, metadata)
        }
    }
    async handleChainEnd(outputs, runId) {
        if (this.chatId && runId === this.currentRunId) {
            const answer = outputs.output
            this.thread.trackMessage({
                id: this.apiMessageId,
                content: answer,
                role: 'assistant'
            })
            this.currentRunId = null
        }
        super.handleChainEnd(outputs, runId)
    }
}
const additionalCallbacks = async (nodeData, options) => {
    try {
        if (!options.analytic && !(0, tracingEnv_1.tracingEnvEnabled)()) return []
        const initial = options.analytic ? JSON.parse(options.analytic) : {}
        const { analytic, envCredentials } = (0, tracingEnv_1.applyEnvTracingProviders)(initial)
        const callbacks = []
        for (const provider in analytic) {
            const providerStatus = analytic[provider].status
            if (providerStatus) {
                const credentialData =
                    envCredentials[provider] ?? (await (0, utils_1.getCredentialData)(analytic[provider].credentialId ?? '', options))
                if (provider === 'langSmith') {
                    const langSmithProject = analytic[provider].projectName
                    const langSmithApiKey = (0, utils_1.getCredentialParam)('langSmithApiKey', credentialData, nodeData)
                    const langSmithEndpoint = (0, utils_1.getCredentialParam)('langSmithEndpoint', credentialData, nodeData)
                    const client = new langsmith_1.Client({
                        apiUrl: langSmithEndpoint ?? 'https://api.smith.langchain.com',
                        apiKey: langSmithApiKey
                    })
                    let langSmithField = {
                        projectName: langSmithProject ?? 'default',
                        //@ts-ignore
                        client
                    }
                    if (nodeData?.inputs?.analytics?.langSmith) {
                        langSmithField = { ...langSmithField, ...nodeData?.inputs?.analytics?.langSmith }
                    }
                    const tracer = new tracer_langchain_1.LangChainTracer(langSmithField)
                    callbacks.push(tracer)
                } else if (provider === 'langFuse') {
                    const release = analytic[provider].release
                    const langFuseSecretKey = (0, utils_1.getCredentialParam)('langFuseSecretKey', credentialData, nodeData)
                    const langFusePublicKey = (0, utils_1.getCredentialParam)('langFusePublicKey', credentialData, nodeData)
                    const langFuseEndpoint = (0, utils_1.getCredentialParam)('langFuseEndpoint', credentialData, nodeData)
                    let langFuseOptions = {
                        secretKey: langFuseSecretKey,
                        publicKey: langFusePublicKey,
                        baseUrl: langFuseEndpoint ?? 'https://cloud.langfuse.com',
                        sdkIntegration: 'Flowise'
                    }
                    if (release) langFuseOptions.release = release
                    if (options.chatId) langFuseOptions.sessionId = options.chatId
                    if (nodeData?.inputs?.analytics?.langFuse) {
                        langFuseOptions = { ...langFuseOptions, ...nodeData?.inputs?.analytics?.langFuse }
                    }
                    const handler = new langfuse_langchain_1.default(langFuseOptions)
                    callbacks.push(handler)
                } else if (provider === 'lunary') {
                    const lunaryPublicKey = (0, utils_1.getCredentialParam)('lunaryAppId', credentialData, nodeData)
                    const lunaryEndpoint = (0, utils_1.getCredentialParam)('lunaryEndpoint', credentialData, nodeData)
                    let lunaryFields = {
                        publicKey: lunaryPublicKey,
                        apiUrl: lunaryEndpoint ?? 'https://api.lunary.ai',
                        runtime: 'flowise',
                        flowiseOptions: options
                    }
                    if (nodeData?.inputs?.analytics?.lunary) {
                        lunaryFields = { ...lunaryFields, ...nodeData?.inputs?.analytics?.lunary }
                    }
                    const handler = new ExtendedLunaryHandler(lunaryFields)
                    callbacks.push(handler)
                } else if (provider === 'evaluation') {
                    if (options.llamaIndex) {
                        new EvaluationRunTracerLlama_1.EvaluationRunTracerLlama(options.evaluationRunId)
                    } else {
                        const evaluationHandler = new EvaluationRunTracer_1.EvaluationRunTracer(options.evaluationRunId)
                        callbacks.push(evaluationHandler)
                    }
                } else if (provider === 'langWatch') {
                    const langWatchApiKey = (0, utils_1.getCredentialParam)('langWatchApiKey', credentialData, nodeData)
                    const langWatchEndpoint = (0, utils_1.getCredentialParam)('langWatchEndpoint', credentialData, nodeData)
                    const langwatch = new langwatch_1.LangWatch({
                        apiKey: langWatchApiKey,
                        endpoint: langWatchEndpoint
                    })
                    const trace = langwatch.getTrace()
                    if (nodeData?.inputs?.analytics?.langWatch) {
                        trace.update({
                            metadata: {
                                ...nodeData?.inputs?.analytics?.langWatch
                            }
                        })
                    }
                    callbacks.push(trace.getLangChainCallback())
                } else if (provider === 'arize') {
                    const arizeApiKey = (0, utils_1.getCredentialParam)('arizeApiKey', credentialData, nodeData)
                    const arizeSpaceId = (0, utils_1.getCredentialParam)('arizeSpaceId', credentialData, nodeData)
                    const arizeEndpoint = (0, utils_1.getCredentialParam)('arizeEndpoint', credentialData, nodeData)
                    const arizeProject = analytic[provider].projectName
                    let arizeOptions = {
                        apiKey: arizeApiKey,
                        spaceId: arizeSpaceId,
                        baseUrl: arizeEndpoint ?? 'https://otlp.arize.com',
                        projectName: arizeProject ?? 'default',
                        sdkIntegration: 'Flowise',
                        enableCallback: true
                    }
                    if (options.chatId) arizeOptions.sessionId = options.chatId
                    if (nodeData?.inputs?.analytics?.arize) {
                        arizeOptions = { ...arizeOptions, ...nodeData?.inputs?.analytics?.arize }
                    }
                    const tracer = getArizeTracer(arizeOptions)
                    callbacks.push(tracer)
                } else if (provider === 'phoenix') {
                    const phoenixApiKey = (0, utils_1.getCredentialParam)('phoenixApiKey', credentialData, nodeData)
                    const phoenixEndpoint = (0, utils_1.getCredentialParam)('phoenixEndpoint', credentialData, nodeData)
                    const phoenixProject = analytic[provider].projectName
                    let phoenixOptions = {
                        apiKey: phoenixApiKey,
                        baseUrl: phoenixEndpoint ?? 'https://app.phoenix.arize.com',
                        projectName: phoenixProject ?? 'default',
                        sdkIntegration: 'Flowise',
                        enableCallback: true
                    }
                    if (options.chatId) phoenixOptions.sessionId = options.chatId
                    if (nodeData?.inputs?.analytics?.phoenix) {
                        phoenixOptions = { ...phoenixOptions, ...nodeData?.inputs?.analytics?.phoenix }
                    }
                    const tracer = getPhoenixTracer(phoenixOptions)
                    callbacks.push(tracer)
                } else if (provider === 'opik') {
                    const opikApiKey = (0, utils_1.getCredentialParam)('opikApiKey', credentialData, nodeData)
                    const opikEndpoint = (0, utils_1.getCredentialParam)('opikUrl', credentialData, nodeData)
                    const opikWorkspace = (0, utils_1.getCredentialParam)('opikWorkspace', credentialData, nodeData)
                    const opikProject = analytic[provider].opikProjectName
                    let opikOptions = {
                        apiKey: opikApiKey,
                        baseUrl: opikEndpoint ?? 'https://www.comet.com/opik/api',
                        projectName: opikProject ?? 'default',
                        workspace: opikWorkspace ?? 'default',
                        sdkIntegration: 'Flowise',
                        enableCallback: true
                    }
                    if (options.chatId) opikOptions.sessionId = options.chatId
                    if (nodeData?.inputs?.analytics?.opik) {
                        opikOptions = { ...opikOptions, ...nodeData?.inputs?.analytics?.opik }
                    }
                    const tracer = getOpikTracer(opikOptions)
                    callbacks.push(tracer)
                }
            }
        }
        return callbacks
    } catch (e) {
        throw new Error(e)
    }
}
exports.additionalCallbacks = additionalCallbacks
class AnalyticHandler {
    constructor(nodeData, options) {
        this.handlers = {}
        this.initialized = false
        this.nodeData = nodeData
        this.options = options
        this.analyticsConfig = options.analytic
        this.chatId = options.chatId
        this.createdAt = Date.now()
    }
    static getInstance(nodeData, options) {
        const chatId = options.chatId
        if (!chatId) throw new Error('ChatId is required for analytics')
        // Reset instance if analytics config changed for this chat
        const instance = AnalyticHandler.instances.get(chatId)
        if (instance?.analyticsConfig !== options.analytic) {
            AnalyticHandler.resetInstance(chatId)
        }
        if (!AnalyticHandler.instances.get(chatId)) {
            AnalyticHandler.instances.set(chatId, new AnalyticHandler(nodeData, options))
        }
        return AnalyticHandler.instances.get(chatId)
    }
    static resetInstance(chatId) {
        AnalyticHandler.instances.delete(chatId)
    }
    // Keep this as backup for orphaned instances
    static cleanup(maxAge = 3600000) {
        const now = Date.now()
        for (const [chatId, instance] of AnalyticHandler.instances) {
            if (now - instance.createdAt > maxAge) {
                AnalyticHandler.resetInstance(chatId)
            }
        }
    }
    /**
     * Helper method to end an OpenTelemetry span with output, token usage, and model name attributes.
     * Used by arize, phoenix, and opik providers.
     */
    _endOtelSpan(providerName, returnIds, outputText, usageMetadata, modelName) {
        const llmSpan = this.handlers[providerName]?.llmSpan?.[returnIds[providerName]?.llmSpan]
        if (llmSpan) {
            llmSpan.setAttribute('output.value', JSON.stringify(outputText))
            llmSpan.setAttribute('output.mime_type', 'application/json')
            if (usageMetadata) {
                if (usageMetadata.input_tokens !== undefined) {
                    llmSpan.setAttribute('llm.token_count.prompt', usageMetadata.input_tokens)
                }
                if (usageMetadata.output_tokens !== undefined) {
                    llmSpan.setAttribute('llm.token_count.completion', usageMetadata.output_tokens)
                }
                if (usageMetadata.total_tokens !== undefined) {
                    llmSpan.setAttribute('llm.token_count.total', usageMetadata.total_tokens)
                }
            }
            if (modelName) {
                llmSpan.setAttribute('llm.model_name', modelName)
            }
            llmSpan.setStatus({ code: api_1.SpanStatusCode.OK })
            llmSpan.end()
        }
    }
    async init() {
        if (this.initialized) return
        try {
            const hasAnalyticsConfig = Boolean(this.options.analytic)
            if (!hasAnalyticsConfig && !(0, tracingEnv_1.tracingEnvEnabled)()) return
            const initial = hasAnalyticsConfig ? JSON.parse(this.options.analytic) : {}
            const { analytic, envCredentials } = (0, tracingEnv_1.applyEnvTracingProviders)(initial)
            for (const provider in analytic) {
                const providerStatus = analytic[provider].status
                if (providerStatus) {
                    const credentialData =
                        envCredentials[provider] ??
                        (await (0, utils_1.getCredentialData)(analytic[provider].credentialId ?? '', this.options))
                    await this.initializeProvider(provider, analytic[provider], credentialData)
                }
            }
            this.initialized = true
        } catch (e) {
            throw new Error(e)
        }
    }
    hasActiveProviders() {
        return Object.keys(this.handlers).length > 0
    }
    // Add getter for handlers (useful for debugging)
    getHandlers() {
        return this.handlers
    }
    async initializeProvider(provider, providerConfig, credentialData) {
        if (provider === 'langSmith') {
            const langSmithProject = providerConfig.projectName
            const langSmithApiKey = (0, utils_1.getCredentialParam)('langSmithApiKey', credentialData, this.nodeData)
            const langSmithEndpoint = (0, utils_1.getCredentialParam)('langSmithEndpoint', credentialData, this.nodeData)
            const client = new langsmith_2.Client({
                apiUrl: langSmithEndpoint ?? 'https://api.smith.langchain.com',
                apiKey: langSmithApiKey
            })
            this.handlers['langSmith'] = {
                client,
                langSmithProject
            }
        } else if (provider === 'langFuse') {
            const release = providerConfig.release
            const langFuseSecretKey = (0, utils_1.getCredentialParam)('langFuseSecretKey', credentialData, this.nodeData)
            const langFusePublicKey = (0, utils_1.getCredentialParam)('langFusePublicKey', credentialData, this.nodeData)
            const langFuseEndpoint = (0, utils_1.getCredentialParam)('langFuseEndpoint', credentialData, this.nodeData)
            const langfuse = new langfuse_1.Langfuse({
                secretKey: langFuseSecretKey,
                publicKey: langFusePublicKey,
                baseUrl: langFuseEndpoint ?? 'https://cloud.langfuse.com',
                sdkIntegration: 'Flowise',
                release
            })
            this.handlers['langFuse'] = { client: langfuse }
        } else if (provider === 'lunary') {
            const lunaryPublicKey = (0, utils_1.getCredentialParam)('lunaryAppId', credentialData, this.nodeData)
            const lunaryEndpoint = (0, utils_1.getCredentialParam)('lunaryEndpoint', credentialData, this.nodeData)
            lunary_1.default.init({
                publicKey: lunaryPublicKey,
                apiUrl: lunaryEndpoint,
                runtime: 'flowise'
            })
            this.handlers['lunary'] = { client: lunary_1.default }
        } else if (provider === 'langWatch') {
            const langWatchApiKey = (0, utils_1.getCredentialParam)('langWatchApiKey', credentialData, this.nodeData)
            const langWatchEndpoint = (0, utils_1.getCredentialParam)('langWatchEndpoint', credentialData, this.nodeData)
            const langwatch = new langwatch_1.LangWatch({
                apiKey: langWatchApiKey,
                endpoint: langWatchEndpoint
            })
            this.handlers['langWatch'] = { client: langwatch }
        } else if (provider === 'arize') {
            const arizeApiKey = (0, utils_1.getCredentialParam)('arizeApiKey', credentialData, this.nodeData)
            const arizeSpaceId = (0, utils_1.getCredentialParam)('arizeSpaceId', credentialData, this.nodeData)
            const arizeEndpoint = (0, utils_1.getCredentialParam)('arizeEndpoint', credentialData, this.nodeData)
            const arizeProject = providerConfig.projectName
            let arizeOptions = {
                apiKey: arizeApiKey,
                spaceId: arizeSpaceId,
                baseUrl: arizeEndpoint ?? 'https://otlp.arize.com',
                projectName: arizeProject ?? 'default',
                sdkIntegration: 'Flowise',
                enableCallback: false
            }
            const arize = getArizeTracer(arizeOptions)
            const rootSpan = undefined
            this.handlers['arize'] = { client: arize, arizeProject, rootSpan }
        } else if (provider === 'phoenix') {
            const phoenixApiKey = (0, utils_1.getCredentialParam)('phoenixApiKey', credentialData, this.nodeData)
            const phoenixEndpoint = (0, utils_1.getCredentialParam)('phoenixEndpoint', credentialData, this.nodeData)
            const phoenixProject = providerConfig.projectName
            let phoenixOptions = {
                apiKey: phoenixApiKey,
                baseUrl: phoenixEndpoint ?? 'https://app.phoenix.arize.com',
                projectName: phoenixProject ?? 'default',
                sdkIntegration: 'Flowise',
                enableCallback: false
            }
            const phoenix = getPhoenixTracer(phoenixOptions)
            const rootSpan = undefined
            this.handlers['phoenix'] = { client: phoenix, phoenixProject, rootSpan }
        } else if (provider === 'opik') {
            const opikApiKey = (0, utils_1.getCredentialParam)('opikApiKey', credentialData, this.nodeData)
            const opikEndpoint = (0, utils_1.getCredentialParam)('opikUrl', credentialData, this.nodeData)
            const opikWorkspace = (0, utils_1.getCredentialParam)('opikWorkspace', credentialData, this.nodeData)
            const opikProject = providerConfig.opikProjectName
            let opikOptions = {
                apiKey: opikApiKey,
                baseUrl: opikEndpoint ?? 'https://www.comet.com/opik/api',
                projectName: opikProject ?? 'default',
                workspace: opikWorkspace ?? 'default',
                sdkIntegration: 'Flowise',
                enableCallback: false
            }
            const opik = getOpikTracer(opikOptions)
            const rootSpan = undefined
            this.handlers['opik'] = { client: opik, opikProject, rootSpan }
        }
    }
    async onChainStart(name, input, parentIds) {
        const returnIds = {
            langSmith: {},
            langFuse: {},
            lunary: {},
            langWatch: {},
            arize: {},
            phoenix: {},
            opik: {}
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langSmith')) {
            if (!parentIds || !Object.keys(parentIds).length) {
                const parentRunConfig = {
                    name,
                    run_type: 'chain',
                    inputs: {
                        text: input
                    },
                    serialized: {},
                    project_name: this.handlers['langSmith'].langSmithProject,
                    client: this.handlers['langSmith'].client,
                    ...this.nodeData?.inputs?.analytics?.langSmith
                }
                const parentRun = new langsmith_2.RunTree(parentRunConfig)
                await parentRun.postRun()
                // Merge rather than replace: AnalyticHandler is a per-chatId singleton, so recursive
                // executeAgentFlow calls (e.g. iterationAgentflow) re-enter onChainStart on the same
                // instance. Replacing would drop the outer call's parent entry and orphan its trace.
                this.handlers['langSmith'].chainRun = {
                    ...this.handlers['langSmith'].chainRun,
                    [parentRun.id]: parentRun
                }
                returnIds['langSmith'].chainRun = parentRun.id
            } else {
                const parentRun = this.handlers['langSmith'].chainRun[parentIds['langSmith'].chainRun]
                if (parentRun) {
                    const childChainRun = await parentRun.createChild({
                        name,
                        run_type: 'chain',
                        inputs: {
                            text: input
                        }
                    })
                    await childChainRun.postRun()
                    this.handlers['langSmith'].chainRun = {
                        ...this.handlers['langSmith'].chainRun,
                        [childChainRun.id]: childChainRun
                    }
                    returnIds['langSmith'].chainRun = childChainRun.id
                }
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langFuse')) {
            let langfuseTraceClient
            if (!parentIds || !Object.keys(parentIds).length) {
                const langfuse = this.handlers['langFuse'].client
                langfuseTraceClient = langfuse.trace({
                    name,
                    sessionId: this.options.chatId,
                    metadata: { tags: ['openai-assistant'] },
                    ...this.nodeData?.inputs?.analytics?.langFuse
                })
            } else {
                langfuseTraceClient = this.handlers['langFuse'].trace[parentIds['langFuse']]
            }
            if (langfuseTraceClient) {
                langfuseTraceClient.update({
                    input: {
                        text: input
                    }
                })
                const span = langfuseTraceClient.span({
                    name,
                    input: {
                        text: input
                    }
                })
                this.handlers['langFuse'].trace = { [langfuseTraceClient.id]: langfuseTraceClient }
                this.handlers['langFuse'].span = { [span.id]: span }
                returnIds['langFuse'].trace = langfuseTraceClient.id
                returnIds['langFuse'].span = span.id
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'lunary')) {
            const monitor = this.handlers['lunary'].client
            if (monitor) {
                const runId = (0, uuid_1.v4)()
                await monitor.trackEvent('chain', 'start', {
                    runId,
                    name,
                    input,
                    ...this.nodeData?.inputs?.analytics?.lunary
                })
                this.handlers['lunary'].chainEvent = { [runId]: runId }
                returnIds['lunary'].chainEvent = runId
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langWatch')) {
            let langwatchTrace
            if (!parentIds || !Object.keys(parentIds).length) {
                const langwatch = this.handlers['langWatch'].client
                langwatchTrace = langwatch.getTrace({
                    name,
                    metadata: { tags: ['openai-assistant'], threadId: this.options.chatId },
                    ...this.nodeData?.inputs?.analytics?.langWatch
                })
            } else {
                langwatchTrace = this.handlers['langWatch'].trace[parentIds['langWatch']]
            }
            if (langwatchTrace) {
                const span = langwatchTrace.startSpan({
                    name,
                    type: 'chain',
                    input: (0, langwatch_1.autoconvertTypedValues)(input)
                })
                this.handlers['langWatch'].trace = { [langwatchTrace.traceId]: langwatchTrace }
                this.handlers['langWatch'].span = { [span.spanId]: span }
                returnIds['langWatch'].trace = langwatchTrace.traceId
                returnIds['langWatch'].span = span.spanId
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'arize')) {
            const tracer = this.handlers['arize'].client
            let rootSpan = this.handlers['arize'].rootSpan
            if (!parentIds || !Object.keys(parentIds).length) {
                rootSpan = tracer ? tracer.startSpan('Flowise') : undefined
                if (rootSpan) {
                    rootSpan.setAttribute('session.id', this.options.chatId)
                    rootSpan.setAttribute('openinference.span.kind', 'CHAIN')
                    rootSpan.setAttribute('input.value', input)
                    rootSpan.setAttribute('input.mime_type', 'text/plain')
                    rootSpan.setAttribute('output.value', '[Object]')
                    rootSpan.setAttribute('output.mime_type', 'text/plain')
                    rootSpan.setStatus({ code: api_1.SpanStatusCode.OK })
                    rootSpan.end()
                }
                this.handlers['arize'].rootSpan = rootSpan
            }
            const rootSpanContext = rootSpan
                ? api_1.default.trace.setSpan(api_1.default.context.active(), rootSpan)
                : api_1.default.context.active()
            const chainSpan = tracer?.startSpan(name, undefined, rootSpanContext)
            if (chainSpan) {
                chainSpan.setAttribute('openinference.span.kind', 'CHAIN')
                chainSpan.setAttribute('input.value', JSON.stringify(input))
                chainSpan.setAttribute('input.mime_type', 'application/json')
            }
            const chainSpanId = chainSpan?.spanContext().spanId
            this.handlers['arize'].chainSpan = { [chainSpanId]: chainSpan }
            returnIds['arize'].chainSpan = chainSpanId
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'phoenix')) {
            const tracer = this.handlers['phoenix'].client
            let rootSpan = this.handlers['phoenix'].rootSpan
            if (!parentIds || !Object.keys(parentIds).length) {
                rootSpan = tracer ? tracer.startSpan('Flowise') : undefined
                if (rootSpan) {
                    rootSpan.setAttribute('session.id', this.options.chatId)
                    rootSpan.setAttribute('openinference.span.kind', 'CHAIN')
                    rootSpan.setAttribute('input.value', input)
                    rootSpan.setAttribute('input.mime_type', 'text/plain')
                    rootSpan.setAttribute('output.value', '[Object]')
                    rootSpan.setAttribute('output.mime_type', 'text/plain')
                    rootSpan.setStatus({ code: api_1.SpanStatusCode.OK })
                    rootSpan.end()
                }
                this.handlers['phoenix'].rootSpan = rootSpan
            }
            const rootSpanContext = rootSpan
                ? api_1.default.trace.setSpan(api_1.default.context.active(), rootSpan)
                : api_1.default.context.active()
            const chainSpan = tracer?.startSpan(name, undefined, rootSpanContext)
            if (chainSpan) {
                chainSpan.setAttribute('openinference.span.kind', 'CHAIN')
                chainSpan.setAttribute('input.value', JSON.stringify(input))
                chainSpan.setAttribute('input.mime_type', 'application/json')
            }
            const chainSpanId = chainSpan?.spanContext().spanId
            this.handlers['phoenix'].chainSpan = { [chainSpanId]: chainSpan }
            returnIds['phoenix'].chainSpan = chainSpanId
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'opik')) {
            const tracer = this.handlers['opik'].client
            let rootSpan = this.handlers['opik'].rootSpan
            if (!parentIds || !Object.keys(parentIds).length) {
                rootSpan = tracer ? tracer.startSpan('Flowise') : undefined
                if (rootSpan) {
                    rootSpan.setAttribute('session.id', this.options.chatId)
                    rootSpan.setAttribute('openinference.span.kind', 'CHAIN')
                    rootSpan.setAttribute('input.value', input)
                    rootSpan.setAttribute('input.mime_type', 'text/plain')
                    rootSpan.setAttribute('output.value', '[Object]')
                    rootSpan.setAttribute('output.mime_type', 'text/plain')
                    rootSpan.setStatus({ code: api_1.SpanStatusCode.OK })
                    rootSpan.end()
                }
                this.handlers['opik'].rootSpan = rootSpan
            }
            const rootSpanContext = rootSpan
                ? api_1.default.trace.setSpan(api_1.default.context.active(), rootSpan)
                : api_1.default.context.active()
            const chainSpan = tracer?.startSpan(name, undefined, rootSpanContext)
            if (chainSpan) {
                chainSpan.setAttribute('openinference.span.kind', 'CHAIN')
                chainSpan.setAttribute('input.value', JSON.stringify(input))
                chainSpan.setAttribute('input.mime_type', 'application/json')
            }
            const chainSpanId = chainSpan?.spanContext().spanId
            this.handlers['opik'].chainSpan = { [chainSpanId]: chainSpan }
            returnIds['opik'].chainSpan = chainSpanId
        }
        return returnIds
    }
    async onChainEnd(returnIds, output, shutdown = false) {
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langSmith')) {
            const chainRun = this.handlers['langSmith'].chainRun[returnIds['langSmith'].chainRun]
            if (chainRun) {
                await chainRun.end({
                    outputs: {
                        output
                    }
                })
                await chainRun.patchRun()
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langFuse')) {
            const span = this.handlers['langFuse'].span[returnIds['langFuse'].span]
            if (span) {
                span.end({
                    output
                })
                const langfuseTraceClient = this.handlers['langFuse'].trace[returnIds['langFuse'].trace]
                if (langfuseTraceClient) {
                    langfuseTraceClient.update({
                        output: {
                            output
                        }
                    })
                }
                if (shutdown) {
                    const langfuse = this.handlers['langFuse'].client
                    await langfuse.shutdownAsync()
                }
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'lunary')) {
            const chainEventId = returnIds['lunary'].chainEvent
            const monitor = this.handlers['lunary'].client
            if (monitor && chainEventId) {
                await monitor.trackEvent('chain', 'end', {
                    runId: chainEventId,
                    output
                })
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langWatch')) {
            const span = this.handlers['langWatch'].span[returnIds['langWatch'].span]
            if (span) {
                span.end({
                    output: (0, langwatch_1.autoconvertTypedValues)(output)
                })
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'arize')) {
            const chainSpan = this.handlers['arize'].chainSpan[returnIds['arize'].chainSpan]
            if (chainSpan) {
                chainSpan.setAttribute('output.value', JSON.stringify(output))
                chainSpan.setAttribute('output.mime_type', 'application/json')
                chainSpan.setStatus({ code: api_1.SpanStatusCode.OK })
                chainSpan.end()
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'phoenix')) {
            const chainSpan = this.handlers['phoenix'].chainSpan[returnIds['phoenix'].chainSpan]
            if (chainSpan) {
                chainSpan.setAttribute('output.value', JSON.stringify(output))
                chainSpan.setAttribute('output.mime_type', 'application/json')
                chainSpan.setStatus({ code: api_1.SpanStatusCode.OK })
                chainSpan.end()
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'opik')) {
            const chainSpan = this.handlers['opik'].chainSpan[returnIds['opik'].chainSpan]
            if (chainSpan) {
                chainSpan.setAttribute('output.value', JSON.stringify(output))
                chainSpan.setAttribute('output.mime_type', 'application/json')
                chainSpan.setStatus({ code: api_1.SpanStatusCode.OK })
                chainSpan.end()
            }
        }
        if (shutdown) {
            // Cleanup this instance when chain ends
            AnalyticHandler.resetInstance(this.chatId)
        }
    }
    async onChainError(returnIds, error, shutdown = false) {
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langSmith')) {
            const chainRun = this.handlers['langSmith'].chainRun[returnIds['langSmith'].chainRun]
            if (chainRun) {
                await chainRun.end({
                    error: {
                        error
                    }
                })
                await chainRun.patchRun()
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langFuse')) {
            const span = this.handlers['langFuse'].span[returnIds['langFuse'].span]
            if (span) {
                span.end({
                    output: {
                        error
                    }
                })
                const langfuseTraceClient = this.handlers['langFuse'].trace[returnIds['langFuse'].trace]
                if (langfuseTraceClient) {
                    langfuseTraceClient.update({
                        output: {
                            error
                        }
                    })
                }
                if (shutdown) {
                    const langfuse = this.handlers['langFuse'].client
                    await langfuse.shutdownAsync()
                }
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'lunary')) {
            const chainEventId = returnIds['lunary'].chainEvent
            const monitor = this.handlers['lunary'].client
            if (monitor && chainEventId) {
                await monitor.trackEvent('chain', 'end', {
                    runId: chainEventId,
                    output: error
                })
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langWatch')) {
            const span = this.handlers['langWatch'].span[returnIds['langWatch'].span]
            if (span) {
                span.end({
                    error
                })
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'arize')) {
            const chainSpan = this.handlers['arize'].chainSpan[returnIds['arize'].chainSpan]
            if (chainSpan) {
                chainSpan.setAttribute('error.value', JSON.stringify(error))
                chainSpan.setAttribute('error.mime_type', 'application/json')
                chainSpan.setStatus({ code: api_1.SpanStatusCode.ERROR, message: error.toString() })
                chainSpan.end()
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'phoenix')) {
            const chainSpan = this.handlers['phoenix'].chainSpan[returnIds['phoenix'].chainSpan]
            if (chainSpan) {
                chainSpan.setAttribute('error.value', JSON.stringify(error))
                chainSpan.setAttribute('error.mime_type', 'application/json')
                chainSpan.setStatus({ code: api_1.SpanStatusCode.ERROR, message: error.toString() })
                chainSpan.end()
            }
        }
        if (shutdown) {
            // Cleanup this instance when chain ends
            AnalyticHandler.resetInstance(this.chatId)
        }
    }
    async onLLMStart(name, input, parentIds) {
        const returnIds = {
            langSmith: {},
            langFuse: {},
            lunary: {},
            langWatch: {},
            arize: {},
            phoenix: {},
            opik: {}
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langSmith')) {
            const parentRun = this.handlers['langSmith'].chainRun[parentIds['langSmith'].chainRun]
            if (parentRun) {
                const inputs = {}
                if (Array.isArray(input)) {
                    inputs.messages = input
                } else {
                    inputs.prompts = [input]
                }
                const childLLMRun = await parentRun.createChild({
                    name,
                    run_type: 'llm',
                    inputs
                })
                await childLLMRun.postRun()
                this.handlers['langSmith'].llmRun = { [childLLMRun.id]: childLLMRun }
                returnIds['langSmith'].llmRun = childLLMRun.id
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langFuse')) {
            const trace = this.handlers['langFuse'].trace[parentIds['langFuse'].trace]
            if (trace) {
                const generation = trace.generation({
                    name,
                    input: input
                })
                this.handlers['langFuse'].generation = { [generation.id]: generation }
                returnIds['langFuse'].generation = generation.id
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'lunary')) {
            const monitor = this.handlers['lunary'].client
            const chainEventId = this.handlers['lunary'].chainEvent[parentIds['lunary'].chainEvent]
            if (monitor && chainEventId) {
                const runId = (0, uuid_1.v4)()
                await monitor.trackEvent('llm', 'start', {
                    runId,
                    parentRunId: chainEventId,
                    name,
                    input
                })
                this.handlers['lunary'].llmEvent = { [runId]: runId }
                returnIds['lunary'].llmEvent = runId
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langWatch')) {
            const trace = this.handlers['langWatch'].trace[parentIds['langWatch'].trace]
            if (trace) {
                const span = trace.startLLMSpan({
                    name,
                    input: (0, langwatch_1.autoconvertTypedValues)(input)
                })
                this.handlers['langWatch'].span = { [span.spanId]: span }
                returnIds['langWatch'].span = span.spanId
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'arize')) {
            const tracer = this.handlers['arize'].client
            const rootSpan = this.handlers['arize'].rootSpan
            const rootSpanContext = rootSpan
                ? api_1.default.trace.setSpan(api_1.default.context.active(), rootSpan)
                : api_1.default.context.active()
            const llmSpan = tracer?.startSpan(name, undefined, rootSpanContext)
            if (llmSpan) {
                llmSpan.setAttribute('openinference.span.kind', 'LLM')
                llmSpan.setAttribute('input.value', JSON.stringify(input))
                llmSpan.setAttribute('input.mime_type', 'application/json')
            }
            const llmSpanId = llmSpan?.spanContext().spanId
            this.handlers['arize'].llmSpan = { [llmSpanId]: llmSpan }
            returnIds['arize'].llmSpan = llmSpanId
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'phoenix')) {
            const tracer = this.handlers['phoenix'].client
            const rootSpan = this.handlers['phoenix'].rootSpan
            const rootSpanContext = rootSpan
                ? api_1.default.trace.setSpan(api_1.default.context.active(), rootSpan)
                : api_1.default.context.active()
            const llmSpan = tracer?.startSpan(name, undefined, rootSpanContext)
            if (llmSpan) {
                llmSpan.setAttribute('openinference.span.kind', 'LLM')
                llmSpan.setAttribute('input.value', JSON.stringify(input))
                llmSpan.setAttribute('input.mime_type', 'application/json')
            }
            const llmSpanId = llmSpan?.spanContext().spanId
            this.handlers['phoenix'].llmSpan = { [llmSpanId]: llmSpan }
            returnIds['phoenix'].llmSpan = llmSpanId
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'opik')) {
            const tracer = this.handlers['opik'].client
            const rootSpan = this.handlers['opik'].rootSpan
            const rootSpanContext = rootSpan
                ? api_1.default.trace.setSpan(api_1.default.context.active(), rootSpan)
                : api_1.default.context.active()
            const llmSpan = tracer?.startSpan(name, undefined, rootSpanContext)
            if (llmSpan) {
                llmSpan.setAttribute('openinference.span.kind', 'LLM')
                llmSpan.setAttribute('input.value', JSON.stringify(input))
                llmSpan.setAttribute('input.mime_type', 'application/json')
            }
            const llmSpanId = llmSpan?.spanContext().spanId
            this.handlers['opik'].llmSpan = { [llmSpanId]: llmSpan }
            returnIds['opik'].llmSpan = llmSpanId
        }
        return returnIds
    }
    async onLLMEnd(returnIds, output, { model, provider } = {}) {
        // Extract content, usage metadata, and model name from output
        // Support both string (backward compatible) and structured object formats
        let outputText
        let usageMetadata
        let modelName = model
        if (typeof output === 'string') {
            outputText = output
        } else {
            // Extract text content
            outputText = output.content ?? ''
            // Extract usage metadata (supports both LangChain and OpenAI field names)
            usageMetadata = output.usageMetadata ?? output.usage_metadata
            if (usageMetadata) {
                // Normalize field names for consistent access
                usageMetadata = {
                    input_tokens: usageMetadata.input_tokens ?? usageMetadata.prompt_tokens,
                    output_tokens: usageMetadata.output_tokens ?? usageMetadata.completion_tokens,
                    total_tokens: usageMetadata.total_tokens
                }
            }
            // Extract model name from response metadata
            const responseMetadata = output.responseMetadata ?? output.response_metadata
            if (!model && responseMetadata) {
                modelName = responseMetadata.model ?? responseMetadata.model_name ?? responseMetadata.modelId
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langSmith')) {
            const llmRun = this.handlers['langSmith'].llmRun[returnIds['langSmith'].llmRun]
            if (llmRun) {
                const outputs = {
                    generations: [outputText]
                }
                // Add usage_metadata and model info to run's extra.metadata for cost tracking
                // LangSmith requires: usage_metadata (with input_tokens, output_tokens, total_tokens)
                // and ls_model_name + ls_provider in metadata for automatic cost calculation
                if (usageMetadata || modelName) {
                    if (!llmRun.extra) {
                        llmRun.extra = {}
                    }
                    if (!llmRun.extra.metadata) {
                        llmRun.extra.metadata = {}
                    }
                    if (usageMetadata) {
                        llmRun.extra.metadata.usage_metadata = {
                            input_tokens: usageMetadata.input_tokens,
                            output_tokens: usageMetadata.output_tokens,
                            total_tokens: usageMetadata.total_tokens
                        }
                    }
                    if (modelName) {
                        llmRun.extra.metadata.ls_model_name = modelName
                    }
                    if (provider) {
                        let normalized = provider.toLowerCase()
                        if (normalized.startsWith('chat')) normalized = normalized.slice(4)
                        if (normalized.endsWith('chat')) normalized = normalized.slice(0, -4)
                        if (normalized.includes('bedrock')) normalized = 'amazon_bedrock'
                        llmRun.extra.metadata.ls_provider = normalized
                    }
                }
                await llmRun.end({
                    outputs
                })
                await llmRun.patchRun()
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langFuse')) {
            const generation = this.handlers['langFuse'].generation[returnIds['langFuse']?.generation]
            if (generation) {
                const endPayload = {
                    output: outputText
                }
                // Add model name if available
                if (modelName) {
                    endPayload.model = modelName
                }
                // Add usage data if available (using Langfuse's OpenAIUsage format)
                if (usageMetadata) {
                    endPayload.usage = {
                        promptTokens: usageMetadata.input_tokens,
                        completionTokens: usageMetadata.output_tokens,
                        totalTokens: usageMetadata.total_tokens
                    }
                }
                generation.end(endPayload)
                // Flush to ensure the generation update is sent before the request completes
                const langfuse = this.handlers['langFuse'].client
                await langfuse.flushAsync()
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'lunary')) {
            const llmEventId = this.handlers['lunary'].llmEvent[returnIds['lunary'].llmEvent]
            const monitor = this.handlers['lunary'].client
            if (monitor && llmEventId) {
                const eventData = {
                    runId: llmEventId,
                    output: outputText
                }
                // Add token usage if available
                if (usageMetadata) {
                    eventData.tokensUsage = {
                        prompt: usageMetadata.input_tokens,
                        completion: usageMetadata.output_tokens
                    }
                }
                if (modelName) {
                    eventData.model = modelName
                }
                await monitor.trackEvent('llm', 'end', eventData)
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langWatch')) {
            const span = this.handlers['langWatch'].span[returnIds['langWatch'].span]
            if (span) {
                const endPayload = {
                    output: (0, langwatch_1.autoconvertTypedValues)(outputText)
                }
                // Add metrics if usage available
                if (usageMetadata) {
                    endPayload.metrics = {
                        promptTokens: usageMetadata.input_tokens,
                        completionTokens: usageMetadata.output_tokens
                    }
                }
                if (modelName) {
                    endPayload.model = modelName
                }
                span.end(endPayload)
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'arize')) {
            this._endOtelSpan('arize', returnIds, outputText, usageMetadata, modelName)
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'phoenix')) {
            this._endOtelSpan('phoenix', returnIds, outputText, usageMetadata, modelName)
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'opik')) {
            this._endOtelSpan('opik', returnIds, outputText, usageMetadata, modelName)
        }
    }
    async onLLMError(returnIds, error) {
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langSmith')) {
            const llmRun = this.handlers['langSmith'].llmRun[returnIds['langSmith'].llmRun]
            if (llmRun) {
                await llmRun.end({
                    error: {
                        error
                    }
                })
                await llmRun.patchRun()
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langFuse')) {
            const generation = this.handlers['langFuse'].generation[returnIds['langFuse'].generation]
            if (generation) {
                generation.end({
                    output: error
                })
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'lunary')) {
            const llmEventId = this.handlers['lunary'].llmEvent[returnIds['lunary'].llmEvent]
            const monitor = this.handlers['lunary'].client
            if (monitor && llmEventId) {
                await monitor.trackEvent('llm', 'end', {
                    runId: llmEventId,
                    output: error
                })
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langWatch')) {
            const span = this.handlers['langWatch'].span[returnIds['langWatch'].span]
            if (span) {
                span.end({
                    error
                })
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'arize')) {
            const llmSpan = this.handlers['arize'].llmSpan[returnIds['arize'].llmSpan]
            if (llmSpan) {
                llmSpan.setAttribute('error.value', JSON.stringify(error))
                llmSpan.setAttribute('error.mime_type', 'application/json')
                llmSpan.setStatus({ code: api_1.SpanStatusCode.ERROR, message: error.toString() })
                llmSpan.end()
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'phoenix')) {
            const llmSpan = this.handlers['phoenix'].llmSpan[returnIds['phoenix'].llmSpan]
            if (llmSpan) {
                llmSpan.setAttribute('error.value', JSON.stringify(error))
                llmSpan.setAttribute('error.mime_type', 'application/json')
                llmSpan.setStatus({ code: api_1.SpanStatusCode.ERROR, message: error.toString() })
                llmSpan.end()
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'opik')) {
            const llmSpan = this.handlers['opik'].llmSpan[returnIds['opik'].llmSpan]
            if (llmSpan) {
                llmSpan.setAttribute('error.value', JSON.stringify(error))
                llmSpan.setAttribute('error.mime_type', 'application/json')
                llmSpan.setStatus({ code: api_1.SpanStatusCode.ERROR, message: error.toString() })
                llmSpan.end()
            }
        }
    }
    async onToolStart(name, input, parentIds) {
        const returnIds = {
            langSmith: {},
            langFuse: {},
            lunary: {},
            langWatch: {},
            arize: {},
            phoenix: {},
            opik: {}
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langSmith')) {
            const parentRun = this.handlers['langSmith'].chainRun[parentIds['langSmith'].chainRun]
            if (parentRun) {
                const childToolRun = await parentRun.createChild({
                    name,
                    run_type: 'tool',
                    inputs: {
                        input
                    }
                })
                await childToolRun.postRun()
                this.handlers['langSmith'].toolRun = { [childToolRun.id]: childToolRun }
                returnIds['langSmith'].toolRun = childToolRun.id
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langFuse')) {
            const trace = this.handlers['langFuse'].trace[parentIds['langFuse'].trace]
            if (trace) {
                const toolSpan = trace.span({
                    name,
                    input
                })
                this.handlers['langFuse'].toolSpan = { [toolSpan.id]: toolSpan }
                returnIds['langFuse'].toolSpan = toolSpan.id
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'lunary')) {
            const monitor = this.handlers['lunary'].client
            const chainEventId = this.handlers['lunary'].chainEvent[parentIds['lunary'].chainEvent]
            if (monitor && chainEventId) {
                const runId = (0, uuid_1.v4)()
                await monitor.trackEvent('tool', 'start', {
                    runId,
                    parentRunId: chainEventId,
                    name,
                    input
                })
                this.handlers['lunary'].toolEvent = { [runId]: runId }
                returnIds['lunary'].toolEvent = runId
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langWatch')) {
            const trace = this.handlers['langWatch'].trace[parentIds['langWatch'].trace]
            if (trace) {
                const span = trace.startSpan({
                    name,
                    type: 'tool',
                    input: (0, langwatch_1.autoconvertTypedValues)(input)
                })
                this.handlers['langWatch'].span = { [span.spanId]: span }
                returnIds['langWatch'].span = span.spanId
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'arize')) {
            const tracer = this.handlers['arize'].client
            const rootSpan = this.handlers['arize'].rootSpan
            const rootSpanContext = rootSpan
                ? api_1.default.trace.setSpan(api_1.default.context.active(), rootSpan)
                : api_1.default.context.active()
            const toolSpan = tracer?.startSpan(name, undefined, rootSpanContext)
            if (toolSpan) {
                toolSpan.setAttribute('openinference.span.kind', 'TOOL')
                toolSpan.setAttribute('input.value', JSON.stringify(input))
                toolSpan.setAttribute('input.mime_type', 'application/json')
            }
            const toolSpanId = toolSpan?.spanContext().spanId
            this.handlers['arize'].toolSpan = { [toolSpanId]: toolSpan }
            returnIds['arize'].toolSpan = toolSpanId
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'phoenix')) {
            const tracer = this.handlers['phoenix'].client
            const rootSpan = this.handlers['phoenix'].rootSpan
            const rootSpanContext = rootSpan
                ? api_1.default.trace.setSpan(api_1.default.context.active(), rootSpan)
                : api_1.default.context.active()
            const toolSpan = tracer?.startSpan(name, undefined, rootSpanContext)
            if (toolSpan) {
                toolSpan.setAttribute('openinference.span.kind', 'TOOL')
                toolSpan.setAttribute('input.value', JSON.stringify(input))
                toolSpan.setAttribute('input.mime_type', 'application/json')
            }
            const toolSpanId = toolSpan?.spanContext().spanId
            this.handlers['phoenix'].toolSpan = { [toolSpanId]: toolSpan }
            returnIds['phoenix'].toolSpan = toolSpanId
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'opik')) {
            const tracer = this.handlers['opik'].client
            const rootSpan = this.handlers['opik'].rootSpan
            const rootSpanContext = rootSpan
                ? api_1.default.trace.setSpan(api_1.default.context.active(), rootSpan)
                : api_1.default.context.active()
            const toolSpan = tracer?.startSpan(name, undefined, rootSpanContext)
            if (toolSpan) {
                toolSpan.setAttribute('openinference.span.kind', 'TOOL')
                toolSpan.setAttribute('input.value', JSON.stringify(input))
                toolSpan.setAttribute('input.mime_type', 'application/json')
            }
            const toolSpanId = toolSpan?.spanContext().spanId
            this.handlers['opik'].toolSpan = { [toolSpanId]: toolSpan }
            returnIds['opik'].toolSpan = toolSpanId
        }
        return returnIds
    }
    async onToolEnd(returnIds, output) {
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langSmith')) {
            const toolRun = this.handlers['langSmith'].toolRun[returnIds['langSmith'].toolRun]
            if (toolRun) {
                await toolRun.end({
                    outputs: {
                        output
                    }
                })
                await toolRun.patchRun()
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langFuse')) {
            const toolSpan = this.handlers['langFuse'].toolSpan[returnIds['langFuse'].toolSpan]
            if (toolSpan) {
                toolSpan.end({
                    output
                })
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'lunary')) {
            const toolEventId = this.handlers['lunary'].toolEvent[returnIds['lunary'].toolEvent]
            const monitor = this.handlers['lunary'].client
            if (monitor && toolEventId) {
                await monitor.trackEvent('tool', 'end', {
                    runId: toolEventId,
                    output
                })
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langWatch')) {
            const span = this.handlers['langWatch'].span[returnIds['langWatch'].span]
            if (span) {
                span.end({
                    output: (0, langwatch_1.autoconvertTypedValues)(output)
                })
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'arize')) {
            const toolSpan = this.handlers['arize'].toolSpan[returnIds['arize'].toolSpan]
            if (toolSpan) {
                toolSpan.setAttribute('output.value', JSON.stringify(output))
                toolSpan.setAttribute('output.mime_type', 'application/json')
                toolSpan.setStatus({ code: api_1.SpanStatusCode.OK })
                toolSpan.end()
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'phoenix')) {
            const toolSpan = this.handlers['phoenix'].toolSpan[returnIds['phoenix'].toolSpan]
            if (toolSpan) {
                toolSpan.setAttribute('output.value', JSON.stringify(output))
                toolSpan.setAttribute('output.mime_type', 'application/json')
                toolSpan.setStatus({ code: api_1.SpanStatusCode.OK })
                toolSpan.end()
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'opik')) {
            const toolSpan = this.handlers['opik'].toolSpan[returnIds['opik'].toolSpan]
            if (toolSpan) {
                toolSpan.setAttribute('output.value', JSON.stringify(output))
                toolSpan.setAttribute('output.mime_type', 'application/json')
                toolSpan.setStatus({ code: api_1.SpanStatusCode.OK })
                toolSpan.end()
            }
        }
    }
    async onToolError(returnIds, error) {
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langSmith')) {
            const toolRun = this.handlers['langSmith'].toolRun[returnIds['langSmith'].toolRun]
            if (toolRun) {
                await toolRun.end({
                    error: {
                        error
                    }
                })
                await toolRun.patchRun()
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langFuse')) {
            const toolSpan = this.handlers['langFuse'].toolSpan[returnIds['langFuse'].toolSpan]
            if (toolSpan) {
                toolSpan.end({
                    output: error
                })
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'lunary')) {
            const toolEventId = this.handlers['lunary'].toolEvent[returnIds['lunary'].toolEvent]
            const monitor = this.handlers['lunary'].client
            if (monitor && toolEventId) {
                await monitor.trackEvent('tool', 'end', {
                    runId: toolEventId,
                    output: error
                })
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'langWatch')) {
            const span = this.handlers['langWatch'].span[returnIds['langWatch'].span]
            if (span) {
                span.end({
                    error
                })
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'arize')) {
            const toolSpan = this.handlers['arize'].toolSpan[returnIds['arize'].toolSpan]
            if (toolSpan) {
                toolSpan.setAttribute('error.value', JSON.stringify(error))
                toolSpan.setAttribute('error.mime_type', 'application/json')
                toolSpan.setStatus({ code: api_1.SpanStatusCode.ERROR, message: error.toString() })
                toolSpan.end()
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'phoenix')) {
            const toolSpan = this.handlers['phoenix'].toolSpan[returnIds['phoenix'].toolSpan]
            if (toolSpan) {
                toolSpan.setAttribute('error.value', JSON.stringify(error))
                toolSpan.setAttribute('error.mime_type', 'application/json')
                toolSpan.setStatus({ code: api_1.SpanStatusCode.ERROR, message: error.toString() })
                toolSpan.end()
            }
        }
        if (Object.prototype.hasOwnProperty.call(this.handlers, 'opik')) {
            const toolSpan = this.handlers['opik'].toolSpan[returnIds['opik'].toolSpan]
            if (toolSpan) {
                toolSpan.setAttribute('error.value', JSON.stringify(error))
                toolSpan.setAttribute('error.mime_type', 'application/json')
                toolSpan.setStatus({ code: api_1.SpanStatusCode.ERROR, message: error.toString() })
                toolSpan.end()
            }
        }
    }
}
exports.AnalyticHandler = AnalyticHandler
AnalyticHandler.instances = new Map()
/**
 * Custom callback handler for streaming detailed intermediate information
 * during agent execution, specifically tool invocation inputs and outputs.
 */
class CustomStreamingHandler extends base_1.BaseCallbackHandler {
    constructor(sseStreamer, chatId) {
        super()
        this.name = 'custom_streaming_handler'
        this.sseStreamer = sseStreamer
        this.chatId = chatId
    }
    /**
     * Handle the start of a tool invocation
     */
    async handleToolStart(tool, input, runId, parentRunId) {
        if (!this.sseStreamer) return
        const toolName = typeof tool === 'object' && tool.name ? tool.name : 'unknown-tool'
        const toolInput = typeof input === 'string' ? input : JSON.stringify(input, null, 2)
        // Stream the tool invocation details using the agent_trace event type for consistency
        this.sseStreamer.streamCustomEvent(this.chatId, 'agent_trace', {
            step: 'tool_start',
            name: toolName,
            input: toolInput,
            runId,
            parentRunId: parentRunId || null
        })
    }
    /**
     * Handle the end of a tool invocation
     */
    async handleToolEnd(output, runId, parentRunId) {
        if (!this.sseStreamer) return
        const toolOutput = typeof output === 'string' ? output : JSON.stringify(output, null, 2)
        // Stream the tool output details using the agent_trace event type for consistency
        this.sseStreamer.streamCustomEvent(this.chatId, 'agent_trace', {
            step: 'tool_end',
            output: toolOutput,
            runId,
            parentRunId: parentRunId || null
        })
    }
    /**
     * Handle tool errors
     */
    async handleToolError(error, runId, parentRunId) {
        if (!this.sseStreamer) return
        // Stream the tool error details using the agent_trace event type for consistency
        this.sseStreamer.streamCustomEvent(this.chatId, 'agent_trace', {
            step: 'tool_error',
            error: error.message,
            runId,
            parentRunId: parentRunId || null
        })
    }
    /**
     * Handle agent actions
     */
    async handleAgentAction(action, runId, parentRunId) {
        if (!this.sseStreamer) return
        // Stream the agent action details using the agent_trace event type for consistency
        this.sseStreamer.streamCustomEvent(this.chatId, 'agent_trace', {
            step: 'agent_action',
            action: JSON.stringify(action),
            runId,
            parentRunId: parentRunId || null
        })
    }
}
exports.CustomStreamingHandler = CustomStreamingHandler
//# sourceMappingURL=handler.js.map
