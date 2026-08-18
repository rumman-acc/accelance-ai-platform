import { DataSource } from 'typeorm'
import { ChatMessage } from '../database/entities/ChatMessage'
import { ChatFlow } from '../database/entities/ChatFlow'
import { WorkspaceUser, WorkspaceUserStatus } from '../enterprise/database/entities/workspace-user.entity'
import { ICommonObject } from 'accelance-components'
import { ChatType } from '../Interface'
import { utilAddChatMessage } from './addChatMesage'
import guardrailsService from '../services/guardrails'
import logger from './logger'

/**
 * Single shared pre-flight chokepoint, called from utilBuildChatflow() before executeFlow/
 * executeAgentFlow runs -- covers Topic & Action Scoping and Spend & Token Budgets uniformly
 * across every flow type (classic chatflow, multi-agent, sequential agents, AgentFlow V2), since
 * they all route through utilBuildChatflow first. Must never throw -- a bug here should not take
 * down predictions; on error, fail open (don't block) and log.
 */
export const checkPreflightGuardrails = async (params: {
    appDataSource: DataSource
    workspaceId: string
    chatflowId: string
    chatId: string
    question: string
    chatType?: ChatType
}): Promise<{ blocked: boolean; result?: ICommonObject }> => {
    const { appDataSource, workspaceId, chatflowId, chatId, question, chatType } = params
    try {
        const topicCheck = await guardrailsService.evaluate(workspaceId, chatflowId, 'topic_action_scoping')
        if (topicCheck.enabled) {
            const deniedTopics: string[] = Array.isArray(topicCheck.config?.deniedTopics) ? topicCheck.config?.deniedTopics : []
            const lowerQuestion = (question || '').toLowerCase()
            const matched = deniedTopics.find((topic) => typeof topic === 'string' && lowerQuestion.includes(topic.toLowerCase()))
            if (matched) {
                const refusal = (topicCheck.config?.refusalMessage as string) || "I can't help with that topic."
                return {
                    blocked: true,
                    result: await saveRefusal(appDataSource, chatflowId, chatId, question, refusal, chatType)
                }
            }
        }

        const budgetCheck = await guardrailsService.evaluate(workspaceId, chatflowId, 'spend_token_budgets')
        if (budgetCheck.enabled) {
            const maxPerMonth: number =
                typeof budgetCheck.config?.maxPredictionsPerMonth === 'number' ? budgetCheck.config.maxPredictionsPerMonth : 10000
            const startOfMonth = new Date()
            startOfMonth.setDate(1)
            startOfMonth.setHours(0, 0, 0, 0)
            const count = await appDataSource
                .getRepository(ChatMessage)
                .createQueryBuilder('cm')
                .innerJoin(ChatFlow, 'cf', 'cf.id = cm.chatflowid')
                .where('cf.workspaceId = :workspaceId', { workspaceId })
                .andWhere('cm.role = :role', { role: 'apiMessage' })
                .andWhere('cm.createdDate >= :startOfMonth', { startOfMonth })
                .getCount()
            if (count >= maxPerMonth) {
                const refusal = `This workspace has reached its configured prediction budget for this month (${maxPerMonth}). Contact a workspace admin to raise it.`
                return {
                    blocked: true,
                    result: await saveRefusal(appDataSource, chatflowId, chatId, question, refusal, chatType)
                }
            }
        }
    } catch (e) {
        logger.error('[server]: preflight guardrail check failed, failing open (not blocking)', e)
    }
    return { blocked: false }
}

const saveRefusal = async (
    appDataSource: DataSource,
    chatflowId: string,
    chatId: string,
    question: string,
    refusal: string,
    chatType?: ChatType
): Promise<ICommonObject> => {
    const userMessageDateTime = new Date()
    await utilAddChatMessage(
        {
            role: 'userMessage',
            content: question,
            chatflowid: chatflowId,
            chatId,
            chatType: chatType || ChatType.EXTERNAL,
            createdDate: userMessageDateTime
        },
        appDataSource
    )
    const apiMessage = await utilAddChatMessage(
        {
            role: 'apiMessage',
            content: refusal,
            chatflowid: chatflowId,
            chatId,
            chatType: chatType || ChatType.EXTERNAL
        },
        appDataSource
    )
    return { text: refusal, question, chatId, chatMessageId: apiMessage.id }
}

/**
 * Confused-deputy prevention: when an AgentAsTool inner call carries the original triggering
 * user's id (see AgentAsTool.ts), only trust it as the execution's principal if (a) it's a real
 * flowise-tool-triggered internal request, (b) the target workspace has confused_deputy_prevention
 * enabled, and (c) that user is verified as an active member of the target workspace. Prevents a
 * caller from spoofing an arbitrary userId to gain that user's tool/credential access -- if
 * verification fails, falls back to no principal (today's existing, more restrictive behavior),
 * never to trusting an unverified id.
 */
export const resolveTrustedToolCallerUserId = async (
    appDataSource: DataSource,
    workspaceId: string,
    chatflowId: string,
    isToolTriggered: boolean,
    claimedUserId: string | undefined
): Promise<string | undefined> => {
    if (!isToolTriggered || !claimedUserId) return undefined
    try {
        const check = await guardrailsService.evaluate(workspaceId, chatflowId, 'confused_deputy_prevention')
        if (!check.enabled) return undefined
        const membership = await appDataSource
            .getRepository(WorkspaceUser)
            .findOneBy({ workspaceId, userId: claimedUserId, status: WorkspaceUserStatus.ACTIVE })
        return membership ? claimedUserId : undefined
    } catch (e) {
        logger.error('[server]: confused-deputy verification failed, falling back to no principal', e)
        return undefined
    }
}
