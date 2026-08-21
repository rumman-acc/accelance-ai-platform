import { DataSource } from 'typeorm'
import { ICommonObject, IDatabaseEntity, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../src/Interface'

/**
 * Guardrails v2 Phase 3 -- the generic wrapper node for user-authored custom guardrails
 * targeting `ToolAgent.ts`'s `guardrails` anchor, following exactly the pattern
 * `CustomTool.ts` already uses for user-authored tools: one physical node, always in the
 * palette, whose `asyncOptions` dropdown resolves a workspace's own `GuardrailDefinition` rows
 * (`origin:'custom'`) at flow-build time. See rules/guardrails-v2/phase3-authoring-mechanism.md
 * for why this is a SECOND generic wrapper (identity-scoped custom guardrails get their own
 * `CustomIdentityGuardrail.ts`, not built yet) rather than one node for everything -- Phase 2's
 * connection-validation guarantee depends on each node's `baseClasses` being correct for the
 * one host anchor it's meant to attach to; a single generic type spanning both categories
 * would make that guarantee meaningless.
 *
 * Only `kindKey:'regex_match'` definitions are listed today -- the only kind with a real
 * generic executor (`evaluateRegexMatch`) and the only one whose `hooks` field
 * (`'pre'|'post'`) is dispatched by `runAttachedGuardrails.ts`'s `runCustomToolCallGuardrails`.
 */
class CustomToolCallGuardrail_Guardrails implements INode {
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
        this.label = 'Custom Guardrail (Tool Call)'
        this.name = 'customToolCallGuardrail'
        this.version = 1.0
        this.type = 'Guardrail'
        this.icon = 'guardrail.svg'
        this.category = 'Guardrails'
        this.description = "Attaches one of this workspace's own custom guardrail definitions to a tool-call host node"
        // 'ToolCallGuardrail' matches ToolAgent.ts's anchor type exactly -- see
        // EgressFiltering.ts's comment for why this string, not a category/allowedHosts
        // lookup, is what isValidConnection actually enforces.
        this.baseClasses = [this.type, 'ToolCallGuardrail']
        this.inputs = [
            {
                label: 'Select Custom Guardrail',
                name: 'selectedDefinition',
                type: 'asyncOptions',
                loadMethod: 'listCustomToolCallGuardrails'
            },
            {
                label: 'Observe Only (do not enforce yet)',
                name: 'observeMode',
                type: 'boolean',
                default: true,
                description:
                    'While on, this guardrail only records what it would have done -- it never blocks or redacts a real tool call. Turn off to enforce.'
            }
        ]
    }

    //@ts-ignore
    loadMethods = {
        async listCustomToolCallGuardrails(_: INodeData, options: ICommonObject): Promise<INodeOptionsValue[]> {
            const appDataSource = options.appDataSource as DataSource
            const databaseEntities = options.databaseEntities as IDatabaseEntity
            if (!appDataSource || !databaseEntities) return []

            const searchOptions = options.searchOptions || {}
            const repo = appDataSource.getRepository(databaseEntities['GuardrailDefinition'])
            const definitions = await repo.find({
                where: {
                    ...searchOptions,
                    origin: 'custom',
                    kindKey: 'regex_match',
                    deletedAt: null,
                    supersededByDefinitionId: null
                }
            })

            return definitions.map((def: ICommonObject) => ({
                label: def.name as string,
                name: def.id as string,
                description: def.description as string
            }))
        }
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const selectedDefinitionId = nodeData.inputs?.selectedDefinition as string
        const observeMode = nodeData.inputs?.observeMode !== false

        const appDataSource = options.appDataSource as DataSource
        const databaseEntities = options.databaseEntities as IDatabaseEntity
        const definition = await appDataSource.getRepository(databaseEntities['GuardrailDefinition']).findOneBy({
            id: selectedDefinitionId
        })
        if (!definition) throw new Error(`Custom guardrail definition ${selectedDefinitionId} not found`)

        let params: Record<string, unknown> = {}
        try {
            params = JSON.parse((definition as ICommonObject).defaultParams as string)
        } catch {
            params = {}
        }

        return {
            definitionKey: (definition as ICommonObject).key,
            kindKey: (definition as ICommonObject).kindKey,
            origin: 'custom',
            hooks: (definition as ICommonObject).hooks,
            observeMode,
            ...params
        }
    }
}

module.exports = { nodeClass: CustomToolCallGuardrail_Guardrails }
