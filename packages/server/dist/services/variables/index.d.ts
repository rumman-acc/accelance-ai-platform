import { Variable } from '../../database/entities/Variable';
import { QueryRunner } from 'typeorm';
declare const _default: {
    createVariable: (newVariable: Variable, orgId: string) => Promise<Variable>;
    deleteVariable: (variableId: string, workspaceId: string) => Promise<any>;
    getAllVariables: (workspaceId: string, page?: number, limit?: number) => Promise<Variable[] | {
        data: Variable[];
        total: number;
    }>;
    getVariableById: (variableId: string, workspaceId: string) => Promise<Variable | null>;
    updateVariable: (variable: Variable, updatedVariable: Variable) => Promise<Variable>;
    importVariables: (newVariables: Partial<Variable>[], queryRunner?: QueryRunner) => Promise<any>;
};
export default _default;
