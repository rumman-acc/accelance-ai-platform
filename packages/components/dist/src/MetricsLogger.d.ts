import { BaseTracer, Run } from '@langchain/core/tracers/base';
import { Logger } from 'winston';
export declare class MetricsLogger extends BaseTracer {
    name: "console_callback_handler";
    logger: Logger;
    orgId?: string;
    protected persistRun(_run: Run): Promise<void>;
    constructor(logger: Logger, orgId?: string);
    getParents(run: Run): Run[];
    getBreadcrumbs(run: Run): string;
    onChainStart(run: Run): void;
    onChainEnd(run: Run): void;
    onChainError(run: Run): void;
    onLLMStart(run: Run): void;
    onLLMEnd(run: Run): void;
    onLLMError(run: Run): void;
    onToolStart(run: Run): void;
    onToolEnd(run: Run): void;
    onToolError(run: Run): void;
    onAgentAction(run: Run): void;
}
