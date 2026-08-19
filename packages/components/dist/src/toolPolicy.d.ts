import { ICommonObject } from './Interface';
export interface IToolPolicyContext {
    workspaceId: string;
    chatflowId: string;
    toolNodeName: string;
    /** Undefined for unauthenticated/API-key/public-chatbot-triggered runs -- there is no
     * principal to check credential grants against; only the allowlist below still applies. */
    userId?: string;
    credentialId?: string;
}
export type IToolCallDecision = 'allowed' | 'denied';
/**
 * Checks the AgentToolPolicy allowlist (most-specific-match-wins, defaults to allow when no row
 * exists), then -- only when there's both a principal and a credential -- CredentialAccess
 * ownership/grants, falling back to WorkspaceShared cross-workspace membership. Mirrors
 * services/tool-policy and services/credential-access on the server side; duplicated here
 * rather than imported, since this package has no dependency on the server package and only
 * ever reaches the database through the appDataSource/databaseEntities already threaded into
 * every node's options bag (the same pattern getCredentialData uses).
 */
export declare const evaluateToolCall: (context: IToolPolicyContext, options: ICommonObject) => Promise<{
    decision: IToolCallDecision;
    reason?: string;
}>;
/**
 * Wraps a LangChain Tool instance (or array of them) so every invocation of `_call` first runs
 * evaluateToolCall(). Mutates the instance's `_call` rather than replacing the object, since
 * `.call()` (the base class's public entry point, which drives callback/observability hooks
 * like handleToolStart/End/Error) always dispatches to `this._call(...)` -- overriding at that
 * layer means a denial surfaces as a normal tool-error observation through the existing
 * machinery, not a special case the LLM has to be taught about.
 */
export declare const wrapToolWithPolicy: <T>(tool: T, context: IToolPolicyContext, options: ICommonObject) => T;
