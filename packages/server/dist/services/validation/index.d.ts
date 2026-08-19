import { IComponentNodes, IReactFlowEdge, IReactFlowNode } from '../../Interface';
export interface IValidationResult {
    id: string;
    label: string;
    name: string;
    issues: string[];
}
/**
 * Pure validation logic that checks flow data for structural issues.
 * Operates on already-parsed nodes/edges — no DB or network access.
 */
export declare const validateFlowData: (nodes: IReactFlowNode[], edges: IReactFlowEdge[], componentNodes: IComponentNodes) => IValidationResult[];
declare const _default: {
    checkFlowValidation: (flowId: string, workspaceId?: string) => Promise<IValidationResult[]>;
};
export default _default;
