import { Execution } from '../../../core/types';

interface UseExecutionPollOptions {
    executionId: string;
    pollInterval?: number;
}
interface UseExecutionPollResult {
    execution: Execution | null;
    isLoading: boolean;
    error: string | null;
    refresh: () => void;
}
/**
 * Fetches a single execution by ID and auto-polls while state is INPROGRESS.
 * Polling stops automatically when execution reaches a terminal state.
 *
 * @param executionId - The execution UUID to fetch
 * @param pollInterval - Polling interval in ms (default 3000). Set to 0 to disable auto-poll.
 */
export declare function useExecutionPoll({ executionId, pollInterval }: UseExecutionPollOptions): UseExecutionPollResult;
export {};
