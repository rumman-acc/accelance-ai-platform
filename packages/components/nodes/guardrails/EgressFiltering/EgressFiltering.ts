import { INode, INodeData, INodeParams } from '../../../src/Interface'

/**
 * Guardrails v2 Phase 2 -- a real, physical component node (not DB-synthesized; see
 * rules/guardrails-v2/ for why dynamic DB-driven node registration was descoped for this pass).
 * Attaches to a host node's `guardrails` anchor to run egress_filtering
 * (kinds.md: regex_match) on that host's own tool calls.
 *
 * `init()` returns a plain config object, not a LangChain-typed instance -- confirmed safe by
 * direct trace of resolveVariables/getVariableValue (packages/server/src/utils/index.ts): the
 * classic build path does zero shape validation on a resolved `.data.instance`, it's left
 * entirely to the consuming node (ToolAgent.ts) to interpret.
 */
class EgressFiltering_Guardrails implements INode {
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
        this.label = 'Egress Filtering'
        this.name = 'egressFilteringGuardrail'
        this.version = 1.0
        this.type = 'Guardrail'
        this.icon = 'guardrail.svg'
        this.category = 'Guardrails'
        this.description = 'Blocks a tool call whose arguments reference a blocked domain/host pattern'
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Blocked Domain/Host Patterns',
                name: 'blockedDomainPatterns',
                type: 'string',
                rows: 4,
                placeholder: `169.254.169.254\nlocalhost\n127.0.0.1`,
                description: "An array of string literals (enter one per line) that must not appear in a tool call's stringified arguments."
            },
            {
                label: 'Observe Only (do not block yet)',
                name: 'observeMode',
                type: 'boolean',
                default: true,
                description:
                    'While on, this guardrail only records what it would have done -- it never blocks a real tool call. Turn off to enforce.'
            },
            {
                label: 'Definition Key',
                name: 'definitionKey',
                type: 'string',
                default: 'egress_filtering',
                hidden: true
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const blockedDomainPatternsRaw = (nodeData.inputs?.blockedDomainPatterns as string) || ''
        const observeMode = nodeData.inputs?.observeMode !== false

        return {
            definitionKey: 'egress_filtering',
            kindKey: 'regex_match',
            observeMode,
            blockedDomainPatterns: blockedDomainPatternsRaw
                .split('\n')
                .map((p) => p.trim())
                .filter((p) => p.length > 0)
        }
    }
}

module.exports = { nodeClass: EgressFiltering_Guardrails }
