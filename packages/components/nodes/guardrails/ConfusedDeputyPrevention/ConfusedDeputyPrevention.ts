import { INode, INodeData, INodeParams } from '../../../src/Interface'

/**
 * Guardrails v2 Phase 2 -- see EgressFiltering.ts for the physical-node-vs-DB-synthesis
 * rationale. Attaches to a host node's `guardrails` anchor to run confused_deputy_prevention
 * (kinds.md: enum_constraint approximation -- "allowed set" is the target workspace's active
 * members, resolved dynamically, not a static list from params) before trusting a claimed
 * triggering-user identity passed to a tool the host node exposes as an agent-as-tool.
 */
class ConfusedDeputyPrevention_Guardrails implements INode {
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
        this.label = 'Confused Deputy Prevention'
        this.name = 'confusedDeputyPreventionGuardrail'
        this.version = 1.0
        this.type = 'Guardrail'
        this.icon = 'guardrail.svg'
        this.category = 'Guardrails'
        this.description = 'Verifies a claimed triggering-user identity is an active member of the target workspace before trusting it'
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Observe Only (do not grant trust yet)',
                name: 'observeMode',
                type: 'boolean',
                default: true,
                description:
                    'While on, this guardrail only records what it would have decided -- it never grants real trust to a claimed identity. Turn off to enforce.'
            },
            {
                label: 'Definition Key',
                name: 'definitionKey',
                type: 'string',
                default: 'confused_deputy_prevention',
                hidden: true
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const observeMode = nodeData.inputs?.observeMode !== false

        return {
            definitionKey: 'confused_deputy_prevention',
            kindKey: 'enum_constraint',
            observeMode
        }
    }
}

module.exports = { nodeClass: ConfusedDeputyPrevention_Guardrails }
