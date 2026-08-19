import { IGuardrailCatalogItem } from '../../Interface';
export declare enum GuardrailKind {
    NODE = "node",
    POLICY = "policy"
}
export declare enum GuardrailEnforcementStatus {
    ENFORCED = "enforced",
    PLANNED = "planned"
}
/**
 * The browsable Guardrails & Compliance catalog -- standard entries are seeded by migration
 * (see the AddGuardrailCatalogItem* migrations), custom entries are created per-workspace via
 * the /guardrails/catalog route. Deliberately DB-backed rather than a hardcoded list, so new
 * standard entries can be added by seeding a row without an engineer editing packages/components
 * and redeploying -- same reasoning already applied to the MCP registry browser / Composio
 * catalog importer.
 *
 * `kind: 'node'` entries map to an existing canvas node type (e.g. Content Moderation ->
 * OpenAIModeration/SimplePromptModeration) -- draggable onto the canvas, detected by scanning a
 * chatflow's flowData for `nodeNames`. `kind: 'policy'` entries have no canvas position; they're
 * enabled/configured via GuardrailPolicy and enforced by the engine wherever relevant (see
 * utils/contentRedaction.ts for the PII-redaction chokepoint).
 *
 * `enforcementStatus: 'planned'` entries are listed for visibility only -- the catalog is honest
 * about what the runtime actually does; a 'planned' entry's policy toggle is disabled in the UI
 * rather than silently doing nothing when turned on.
 */
export declare class GuardrailCatalogItem implements IGuardrailCatalogItem {
    id: string;
    key: string;
    name: string;
    description: string;
    kind: GuardrailKind;
    category: string;
    nodeNames?: string;
    enforcementStatus: GuardrailEnforcementStatus;
    configSchema?: string;
    defaultConfig?: string;
    isStandard: boolean;
    workspaceId?: string;
    createdBy?: string;
    createdDate: Date;
    updatedDate: Date;
}
