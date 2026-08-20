import { INode, INodeData, INodeParams } from '../../../src/Interface'

/**
 * Guardrails v2 Phase 2 -- see EgressFiltering.ts for the physical-node-vs-DB-synthesis
 * rationale. Attaches to a host node's `guardrails` anchor to run prompt_injection_defense
 * (kinds.md: regex_match, "match-all" approximation) on that host's own tool call results.
 */
class PromptInjectionDefense_Guardrails implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]

    constructor() {
        this.label = 'Prompt-Injection Defense'
        this.name = 'promptInjectionDefenseGuardrail'
        this.version = 1.1
        this.type = 'Guardrail'
        this.icon = 'guardrail.svg'
        this.category = 'Guardrails'
        this.description = "Wraps a tool's result in untrusted-content delimiters so it cannot redirect the agent"
        // See EgressFiltering.ts for why 'ToolCallGuardrail' -- both are ToolAgent.ts-only.
        this.baseClasses = [this.type, 'ToolCallGuardrail']
        this.inputs = [
            {
                label: 'Observe Only (do not redact yet)',
                name: 'observeMode',
                type: 'boolean',
                default: true,
                description:
                    'While on, this guardrail only records what it would have done -- it never redacts a real tool result. Turn off to enforce.'
            },
            {
                label: 'Definition Key',
                name: 'definitionKey',
                type: 'string',
                default: 'prompt_injection_defense',
                hidden: true
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const observeMode = nodeData.inputs?.observeMode !== false

        return {
            definitionKey: 'prompt_injection_defense',
            kindKey: 'regex_match',
            observeMode
        }
    }
}

module.exports = { nodeClass: PromptInjectionDefense_Guardrails }
