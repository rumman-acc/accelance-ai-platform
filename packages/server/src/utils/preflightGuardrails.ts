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
 *
 * Guardrails v2 (Phase 1): the actual block/allow decision below is UNCHANGED, still driven by
 * the old GuardrailPolicy-backed evaluate() -- per build-plan §8, the old path stays the real
 * decision-maker through the observe window. The new GuardrailFlowAttachment-backed
 * resolveGuardrailAttachment() call alongside it is purely observational: it records a
 * GuardrailVerdict for later diffing against the old path's outcome, and never itself blocks
 * anything. Only after that diff is reviewed does a later, separate change let the new path
 * take over deciding -- see rules/guardrails-v2/reconciliation.md.
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
        const topicStart = Date.now()
        const topicCheck = await guardrailsService.evaluate(workspaceId, chatflowId, 'topic_action_scoping')
        let topicMatched: string | undefined
        if (topicCheck.enabled) {
            const deniedTopics: string[] = Array.isArray(topicCheck.config?.deniedTopics) ? topicCheck.config?.deniedTopics : []
            const lowerQuestion = (question || '').toLowerCase()
            topicMatched = deniedTopics.find((topic) => typeof topic === 'string' && lowerQuestion.includes(topic.toLowerCase()))
        }
        await recordShadowVerdict(
            workspaceId,
            chatflowId,
            'topic_action_scoping',
            'keyword_list',
            topicMatched ? 'block' : 'pass',
            topicMatched ? `matched denied topic "${topicMatched}"` : undefined,
            topicStart
        )
        if (topicMatched) {
            const refusal = (topicCheck.config?.refusalMessage as string) || "I can't help with that topic."
            return {
                blocked: true,
                result: await saveRefusal(appDataSource, chatflowId, chatId, question, refusal, chatType)
            }
        }

        const budgetStart = Date.now()
        const budgetCheck = await guardrailsService.evaluate(workspaceId, chatflowId, 'spend_token_budgets')
        let exceeded = false
        let maxPerMonth = 10000
        let count = 0
        if (budgetCheck.enabled) {
            maxPerMonth = typeof budgetCheck.config?.maxPredictionsPerMonth === 'number' ? budgetCheck.config.maxPredictionsPerMonth : 10000
            const startOfMonth = new Date()
            startOfMonth.setDate(1)
            startOfMonth.setHours(0, 0, 0, 0)
            count = await appDataSource
                .getRepository(ChatMessage)
                .createQueryBuilder('cm')
                .innerJoin(ChatFlow, 'cf', 'cf.id = cm.chatflowid')
                .where('cf.workspaceId = :workspaceId', { workspaceId })
                .andWhere('cm.role = :role', { role: 'apiMessage' })
                .andWhere('cm.createdDate >= :startOfMonth', { startOfMonth })
                .getCount()
            exceeded = count >= maxPerMonth
        }
        await recordShadowVerdict(
            workspaceId,
            chatflowId,
            'spend_token_budgets',
            'rate_limit',
            exceeded ? 'block' : 'pass',
            exceeded ? `${count}/${maxPerMonth} predictions this month` : undefined,
            budgetStart
        )
        if (exceeded) {
            const refusal = `This workspace has reached its configured prediction budget for this month (${maxPerMonth}). Contact a workspace admin to raise it.`
            return {
                blocked: true,
                result: await saveRefusal(appDataSource, chatflowId, chatId, question, refusal, chatType)
            }
        }
    } catch (e) {
        logger.error('[server]: preflight guardrail check failed, failing open (not blocking)', e)
    }
    return { blocked: false }
}

/**
 * Records a GuardrailVerdict from the NEW model's attachment (if any) for this key, tagged
 * observeMode:true unconditionally -- this call never influences the real decision above, which
 * is still made by the OLD evaluate()-backed check. Purely accumulates the comparison data §8
 * step 3 needs before anyone promotes the new path to actually deciding. Never throws.
 */
const recordShadowVerdict = async (
    workspaceId: string,
    chatflowId: string,
    definitionKey: string,
    fallbackKindKey: string,
    oldPathVerdict: 'pass' | 'block',
    reason: string | undefined,
    startedAt: number
): Promise<void> => {
    try {
        const attachment = await guardrailsService.resolveGuardrailAttachment(chatflowId, definitionKey)
        if (!attachment.enabled) return
        await guardrailsService.recordVerdict({
            workspaceId,
            chatflowId,
            definitionKey,
            kindKey: attachment.kindKey || fallbackKindKey,
            verdict: oldPathVerdict,
            reason,
            latencyMs: Date.now() - startedAt,
            observeMode: true
        })
    } catch {
        // Never let verdict recording affect the real guardrail decision.
    }
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
 *
 * Guardrails v2 (Phase 1): decision unchanged, still driven by the old evaluate(); a shadow
 * verdict against the new model is recorded alongside, same reasoning as checkPreflightGuardrails.
 */
export const resolveTrustedToolCallerUserId = async (
    appDataSource: DataSource,
    workspaceId: string,
    chatflowId: string,
    isToolTriggered: boolean,
    claimedUserId: string | undefined
): Promise<string | undefined> => {
    if (!isToolTriggered || !claimedUserId) return undefined
    const start = Date.now()
    try {
        const check = await guardrailsService.evaluate(workspaceId, chatflowId, 'confused_deputy_prevention')
        if (!check.enabled) return undefined
        const membership = await appDataSource
            .getRepository(WorkspaceUser)
            .findOneBy({ workspaceId, userId: claimedUserId, status: WorkspaceUserStatus.ACTIVE })
        const trusted = !!membership
        await recordShadowVerdict(
            workspaceId,
            chatflowId,
            'confused_deputy_prevention',
            'enum_constraint',
            trusted ? 'pass' : 'block',
            trusted ? undefined : `claimed user ${claimedUserId} is not an active member of this workspace`,
            start
        )
        return trusted ? claimedUserId : undefined
    } catch (e) {
        logger.error('[server]: confused-deputy verification failed, falling back to no principal', e)
        return undefined
    }
}
