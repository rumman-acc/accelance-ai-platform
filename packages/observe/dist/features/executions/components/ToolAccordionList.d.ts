import { AvailableToolEntry, NormalizedToolCall, UsedToolRef } from '../../../core/types';

interface AvailableProps {
    variant: 'available';
    tools: AvailableToolEntry[];
    /** Tools listed here get the "Used" chip + green tint. */
    usedTools?: UsedToolRef[];
    /** Number of tools to show before the "Show N more" button. Defaults to 5. */
    initialVisibleCount?: number;
}
interface CalledProps {
    variant: 'called';
    calls: NormalizedToolCall[];
    /** Used to look up an icon + display label for each call's `.name`. */
    availableTools?: AvailableToolEntry[];
}
type ToolAccordionListProps = (AvailableProps | CalledProps) & {
    isDarkMode: boolean;
    apiBaseUrl?: string;
};
/**
 * Unified accordion list for tool surfaces:
 *  - `variant='available'` — agent's available-tools list with optional "Used"
 *    chips + paginated "Show N more" button (replaces the legacy ToolsList).
 *  - `variant='called'` — tool-call invocations from a chat message with a
 *    fixed "Called" chip and warning-toned styling (replaces the legacy
 *    MessageToolCallList).
 */
export declare function ToolAccordionList(props: ToolAccordionListProps): import("react/jsx-runtime").JSX.Element | null;
export {};
