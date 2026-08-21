import dotenv from 'dotenv'
import path from 'path'

const envPath = path.join(__dirname, '..', '..', '.env')
dotenv.config({ path: envPath, override: true })

export * from '../evaluation/EvaluationRunner'
export { MCPToolkit, validateMCPServerConfig } from '../nodes/tools/MCP/core'
export * from './agentflowv2Generator'
export * from './followUpPrompts'
// Guardrails v2 Phase 3 -- only the genuinely generic executor is public surface (needed by
// the server's dry-run tester endpoint, which runs authoring-time checks with no node/DB
// instance involved). checkEgressPattern/wrapPromptInjection/verifyWorkspaceMembership stay
// internal to packages/components -- they're hardcoded to one specific built-in definition
// each, not meant to be called from outside runAttachedGuardrails.ts.
export { evaluateRegexMatch, IRegexMatchParams } from './guardrails/kinds/regexMatch'
export * from './handler'
export * from './headerValidation'
export * from './httpSecurity'
export * from './Interface'
export * from './modelLoader'
export * from './recordManagerSecurity'
export * from './sanitizeDataSourceOptions'
export * from './speechToText'
export * from './storage'
export * from './storageUtils'
export * from './textToSpeech'
export { tracingEnvEnabled } from './tracingEnv'
export * from './toolPolicy'
export * from './toolActionRisk'
export * from './utils'
export * from './validator'
