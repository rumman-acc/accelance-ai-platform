import { Execution } from '../../../core/types';

interface ExecutionsListTableProps {
    executions: Execution[];
    selectedIds: Set<string>;
    onSelectId: (id: string, checked: boolean) => void;
    onSelectAll: (checked: boolean) => void;
    onRowClick: (execution: Execution) => void;
    onDelete?: (execution: Execution) => void;
    allowDelete?: boolean;
}
export declare function ExecutionsListTable({ executions, selectedIds, onSelectId, onSelectAll, onRowClick, onDelete, allowDelete }: ExecutionsListTableProps): import("react/jsx-runtime").JSX.Element;
export {};
