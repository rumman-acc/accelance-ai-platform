import { ExecutionTreeNode } from '../../../core/types';

interface ExecutionTreeSidebarProps {
    tree: ExecutionTreeNode[];
    selectedId: string | null;
    onSelect: (node: ExecutionTreeNode) => void;
    expandedIds: string[];
    onExpandedChange: (ids: string[]) => void;
}
/**
 * Sidebar tree built on `@mui/x-tree-view`'s `RichTreeView`. Visual parity with
 * legacy `ExecutionDetails.jsx`: per-branch border (3px solid when the parent
 * is selected, 1px dashed otherwise) colored from `AGENTFLOW_ICONS`, status
 * icons on the right, virtual iteration nodes use the iteration icon.
 */
export declare function ExecutionTreeSidebar({ tree, selectedId, onSelect, expandedIds, onExpandedChange }: ExecutionTreeSidebarProps): import("react/jsx-runtime").JSX.Element;
export {};
