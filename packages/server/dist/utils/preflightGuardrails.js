"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTrustedToolCallerUserId = exports.checkPreflightGuardrails = void 0;
const ChatMessage_1 = require("../database/entities/ChatMessage");
const ChatFlow_1 = require("../database/entities/ChatFlow");
const workspace_user_entity_1 = require("../enterprise/database/entities/workspace-user.entity");
const Interface_1 = require("../Interface");
const addChatMesage_1 = require("./addChatMesage");
const guardrails_1 = __importDefault(require("../services/guardrails"));
const logger_1 = __importDefault(require("./logger"));
/**
 * Single shared pre-flight chokepoint, called from utilBuildChatflow() before executeFlow/
 * executeAgentFlow runs -- covers Topic & Action Scoping and Spend & Token Budgets uniformly
 * across every flow type (classic chatflow, multi-agent, sequential agents, AgentFlow V2), since
 * they all route through utilBuildChatflow first. Must never throw -- a bug here should not take
 * down predictions; on error, fail open (don't block) and log.
 */
const checkPreflightGuardrails = async (params) => {
    const { appDataSource, workspaceId, chatflowId, chatId, question, chatType } = params;
    try {
        const topicCheck = await guardrails_1.default.evaluate(workspaceId, chatflowId, 'topic_action_scoping');
        if (topicCheck.enabled) {
            const deniedTopics = Array.isArray(topicCheck.config?.deniedTopics) ? topicCheck.config?.deniedTopics : [];
            const lowerQuestion = (question || '').toLowerCase();
            const matched = deniedTopics.find((topic) => typeof topic === 'string' && lowerQuestion.includes(topic.toLowerCase()));
            if (matched) {
                const refusal = topicCheck.config?.refusalMessage || "I can't help with that topic.";
                return {
                    blocked: true,
                    result: await saveRefusal(appDataSource, chatflowId, chatId, question, refusal, chatType)
                };
            }
        }
        const budgetCheck = await guardrails_1.default.evaluate(workspaceId, chatflowId, 'spend_token_budgets');
        if (budgetCheck.enabled) {
            const maxPerMonth = typeof budgetCheck.config?.maxPredictionsPerMonth === 'number' ? budgetCheck.config.maxPredictionsPerMonth : 10000;
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const count = await appDataSource
                .getRepository(ChatMessage_1.ChatMessage)
                .createQueryBuilder('cm')
                .innerJoin(ChatFlow_1.ChatFlow, 'cf', 'cf.id = cm.chatflowid')
                .where('cf.workspaceId = :workspaceId', { workspaceId })
                .andWhere('cm.role = :role', { role: 'apiMessage' })
                .andWhere('cm.createdDate >= :startOfMonth', { startOfMonth })
                .getCount();
            if (count >= maxPerMonth) {
                const refusal = `This workspace has reached its configured prediction budget for this month (${maxPerMonth}). Contact a workspace admin to raise it.`;
                return {
                    blocked: true,
                    result: await saveRefusal(appDataSource, chatflowId, chatId, question, refusal, chatType)
                };
            }
        }
    }
    catch (e) {
        logger_1.default.error('[server]: preflight guardrail check failed, failing open (not blocking)', e);
    }
    return { blocked: false };
};
exports.checkPreflightGuardrails = checkPreflightGuardrails;
const saveRefusal = async (appDataSource, chatflowId, chatId, question, refusal, chatType) => {
    const userMessageDateTime = new Date();
    await (0, addChatMesage_1.utilAddChatMessage)({
        role: 'userMessage',
        content: question,
        chatflowid: chatflowId,
        chatId,
        chatType: chatType || Interface_1.ChatType.EXTERNAL,
        createdDate: userMessageDateTime
    }, appDataSource);
    const apiMessage = await (0, addChatMesage_1.utilAddChatMessage)({
        role: 'apiMessage',
        content: refusal,
        chatflowid: chatflowId,
        chatId,
        chatType: chatType || Interface_1.ChatType.EXTERNAL
    }, appDataSource);
    return { text: refusal, question, chatId, chatMessageId: apiMessage.id };
};
/**
 * Confused-deputy prevention: when an AgentAsTool inner call carries the original triggering
 * user's id (see AgentAsTool.ts), only trust it as the execution's principal if (a) it's a real
 * flowise-tool-triggered internal request, (b) the target workspace has confused_deputy_prevention
 * enabled, and (c) that user is verified as an active member of the target workspace. Prevents a
 * caller from spoofing an arbitrary userId to gain that user's tool/credential access -- if
 * verification fails, falls back to no principal (today's existing, more restrictive behavior),
 * never to trusting an unverified id.
 */
const resolveTrustedToolCallerUserId = async (appDataSource, workspaceId, chatflowId, isToolTriggered, claimedUserId) => {
    if (!isToolTriggered || !claimedUserId)
        return undefined;
    try {
        const check = await guardrails_1.default.evaluate(workspaceId, chatflowId, 'confused_deputy_prevention');
        if (!check.enabled)
            return undefined;
        const membership = await appDataSource
            .getRepository(workspace_user_entity_1.WorkspaceUser)
            .findOneBy({ workspaceId, userId: claimedUserId, status: workspace_user_entity_1.WorkspaceUserStatus.ACTIVE });
        return membership ? claimedUserId : undefined;
    }
    catch (e) {
        logger_1.default.error('[server]: confused-deputy verification failed, falling back to no principal', e);
        return undefined;
    }
};
exports.resolveTrustedToolCallerUserId = resolveTrustedToolCallerUserId;
//# sourceMappingURL=preflightGuardrails.js.map