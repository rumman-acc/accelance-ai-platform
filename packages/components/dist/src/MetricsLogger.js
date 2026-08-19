"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsLogger = void 0;
const base_1 = require("@langchain/core/tracers/base");
const handler_1 = require("./handler");
class MetricsLogger extends base_1.BaseTracer {
    persistRun(_run) {
        return Promise.resolve();
    }
    constructor(logger, orgId) {
        super();
        this.name = 'console_callback_handler';
        this.logger = logger;
        this.orgId = orgId;
    }
    // utility methods
    getParents(run) {
        const parents = [];
        let currentRun = run;
        while (currentRun.parent_run_id) {
            const parent = this.runMap.get(currentRun.parent_run_id);
            if (parent) {
                parents.push(parent);
                currentRun = parent;
            }
            else {
                break;
            }
        }
        return parents;
    }
    getBreadcrumbs(run) {
        const parents = this.getParents(run).reverse();
        const string = [...parents, run]
            .map((parent) => {
            const name = `${parent.execution_order}:${parent.run_type}:${parent.name}`;
            return name;
        })
            .join(' > ');
        return string;
    }
    // logging methods
    onChainStart(run) {
        const crumbs = this.getBreadcrumbs(run);
        this.logger.verbose(`[${this.orgId}]: [chain/start] [${crumbs}] Entering Chain run with input: ${(0, handler_1.tryJsonStringify)(run.inputs, '[inputs]')}`);
    }
    onChainEnd(run) {
        const crumbs = this.getBreadcrumbs(run);
        this.logger.verbose(`[${this.orgId}]: [chain/end] [${crumbs}] [${(0, handler_1.elapsed)(run)}] Exiting Chain run with output: ${(0, handler_1.tryJsonStringify)(run.outputs, '[outputs]')}`);
    }
    onChainError(run) {
        const crumbs = this.getBreadcrumbs(run);
        this.logger.verbose(`[${this.orgId}]: [chain/error] [${crumbs}] [${(0, handler_1.elapsed)(run)}] Chain run errored with error: ${(0, handler_1.tryJsonStringify)(run.error, '[error]')}`);
    }
    onLLMStart(run) {
        const crumbs = this.getBreadcrumbs(run);
        const inputs = 'prompts' in run.inputs ? { prompts: run.inputs.prompts.map((p) => p.trim()) } : run.inputs;
        this.logger.verbose(`[${this.orgId}]: [llm/start] [${crumbs}] Entering LLM run with input: ${(0, handler_1.tryJsonStringify)(inputs, '[inputs]')}`);
    }
    onLLMEnd(run) {
        const crumbs = this.getBreadcrumbs(run);
        this.logger.verbose(`[${this.orgId}]: [llm/end] [${crumbs}] [${(0, handler_1.elapsed)(run)}] Exiting LLM run with output: ${(0, handler_1.tryJsonStringify)(run.outputs, '[response]')}`);
    }
    onLLMError(run) {
        const crumbs = this.getBreadcrumbs(run);
        this.logger.verbose(`[${this.orgId}]: [llm/error] [${crumbs}] [${(0, handler_1.elapsed)(run)}] LLM run errored with error: ${(0, handler_1.tryJsonStringify)(run.error, '[error]')}`);
    }
    onToolStart(run) {
        const crumbs = this.getBreadcrumbs(run);
        this.logger.verbose(`[${this.orgId}]: [tool/start] [${crumbs}] Entering Tool run with input: "${run.inputs.input?.trim()}"`);
    }
    onToolEnd(run) {
        const crumbs = this.getBreadcrumbs(run);
        this.logger.verbose(`[${this.orgId}]: [tool/end] [${crumbs}] [${(0, handler_1.elapsed)(run)}] Exiting Tool run with output: "${run.outputs?.output?.trim()}"`);
    }
    onToolError(run) {
        const crumbs = this.getBreadcrumbs(run);
        this.logger.verbose(`[${this.orgId}]: [tool/error] [${crumbs}] [${(0, handler_1.elapsed)(run)}] Tool run errored with error: ${(0, handler_1.tryJsonStringify)(run.error, '[error]')}`);
    }
    onAgentAction(run) {
        const agentRun = run;
        const crumbs = this.getBreadcrumbs(run);
        this.logger.verbose(`[${this.orgId}]: [agent/action] [${crumbs}] Agent selected action: ${(0, handler_1.tryJsonStringify)(agentRun.actions[agentRun.actions.length - 1], '[action]')}`);
    }
}
exports.MetricsLogger = MetricsLogger;
//# sourceMappingURL=MetricsLogger.js.map