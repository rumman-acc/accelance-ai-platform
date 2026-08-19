import { GuardrailCatalogItem, GuardrailKind, GuardrailEnforcementStatus } from '../../database/entities/GuardrailCatalogItem';
import { GuardrailPolicy } from '../../database/entities/GuardrailPolicy';
declare const _default: {
    listCatalog: (workspaceId: string) => Promise<GuardrailCatalogItem[]>;
    createCustomCatalogItem: (workspaceId: string, name: string, description: string, defaultConfig: Record<string, unknown> | undefined, createdBy?: string) => Promise<GuardrailCatalogItem>;
    listPolicies: (workspaceId: string, chatflowId?: string) => Promise<GuardrailPolicy[]>;
    upsertPolicy: (workspaceId: string, chatflowId: string | undefined, catalogKey: string, enabled: boolean, config: Record<string, unknown> | undefined, createdBy?: string) => Promise<GuardrailPolicy>;
    deletePolicy: (id: string, workspaceId: string) => Promise<import("typeorm").DeleteResult>;
    evaluate: (workspaceId: string, chatflowId: string, catalogKey: string) => Promise<{
        enabled: boolean;
        config?: Record<string, unknown>;
    }>;
    getSummary: (workspaceId: string, chatflowId: string) => Promise<{
        items: ({
            catalogKey: string;
            name: string;
            description: string;
            kind: GuardrailKind;
            enforcementStatus: GuardrailEnforcementStatus;
            active: boolean;
            source: string;
            managedVia: string;
        } | {
            catalogKey: string;
            name: string;
            description: string;
            kind: GuardrailKind.NODE;
            enforcementStatus: GuardrailEnforcementStatus;
            active: boolean;
            source: string;
            managedVia?: undefined;
        } | {
            catalogKey: string;
            name: string;
            description: string;
            kind: GuardrailKind.POLICY;
            enforcementStatus: GuardrailEnforcementStatus;
            active: boolean;
            source: string;
            managedVia?: undefined;
        })[];
        activeCount: number;
    }>;
    getActiveRedactionPatterns: (workspaceId: string, chatflowId: string) => Promise<string[] | null>;
    applyDefaultPolicyTemplate: (workspaceId: string) => Promise<void>;
};
export default _default;
