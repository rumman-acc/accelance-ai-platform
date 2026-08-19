import { DataSource } from 'typeorm';
import { ICommonObject } from 'accelance-components';
import { ChatType } from '../Interface';
/**
 * Single shared pre-flight chokepoint, called from utilBuildChatflow() before executeFlow/
 * executeAgentFlow runs -- covers Topic & Action Scoping and Spend & Token Budgets uniformly
 * across every flow type (classic chatflow, multi-agent, sequential agents, AgentFlow V2), since
 * they all route through utilBuildChatflow first. Must never throw -- a bug here should not take
 * down predictions; on error, fail open (don't block) and log.
 */
export declare const checkPreflightGuardrails: (params: {
    appDataSource: DataSource;
    workspaceId: string;
    chatflowId: string;
    chatId: string;
    question: string;
    chatType?: ChatType;
}) => Promise<{
    blocked: boolean;
    result?: ICommonObject;
}>;
/**
 * Confused-deputy prevention: when an AgentAsTool inner call carries the original triggering
 * user's id (see AgentAsTool.ts), only trust it as the execution's principal if (a) it's a real
 * flowise-tool-triggered internal request, (b) the target workspace has confused_deputy_prevention
 * enabled, and (c) that user is verified as an active member of the target workspace. Prevents a
 * caller from spoofing an arbitrary userId to gain that user's tool/credential access -- if
 * verification fails, falls back to no principal (today's existing, more restrictive behavior),
 * never to trusting an unverified id.
 */
export declare const resolveTrustedToolCallerUserId: (appDataSource: DataSource, workspaceId: string, chatflowId: string, isToolTriggered: boolean, claimedUserId: string | undefined) => Promise<string | undefined>;
