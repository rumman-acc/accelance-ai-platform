import { DataSource } from 'typeorm'
import { ChatMessage } from '../database/entities/ChatMessage'
import { ChatFlow } from '../database/entities/ChatFlow'
import { IChatMessage } from '../Interface'
import { getRunningExpressApp } from '../utils/getRunningExpressApp'
import { redactContent } from './contentRedaction'
import guardrailsService from '../services/guardrails'

/**
 * PII-redaction guardrail chokepoint: only queries/redacts when the message actually has content
 * and a chatflowid to resolve a workspace from -- must never throw, this runs on the hot
 * message-persistence path for every chat turn.
 */
const applyRedactionGuardrail = async (chatMessage: Partial<IChatMessage>, dataSource: DataSource): Promise<void> => {
    if (!chatMessage.content || !chatMessage.chatflowid) return
    try {
        const chatflow = await dataSource.getRepository(ChatFlow).findOne({
            where: { id: chatMessage.chatflowid },
            select: ['id', 'workspaceId']
        })
        if (!chatflow?.workspaceId) return
        const extraPatterns = await guardrailsService.getActiveRedactionPatterns(chatflow.workspaceId, chatMessage.chatflowid)
        if (extraPatterns === null) return
        chatMessage.content = redactContent(chatMessage.content, { patterns: extraPatterns })
    } catch (e) {
        // Guardrail evaluation must never break a chat message save.
        console.error('Failed to apply PII redaction guardrail', e)
    }
}

/**
 * Method that add chat messages.
 * @param {Partial<IChatMessage>} chatMessage
 */
export const utilAddChatMessage = async (chatMessage: Partial<IChatMessage>, appDataSource?: DataSource): Promise<ChatMessage> => {
    const dataSource = appDataSource ?? getRunningExpressApp().AppDataSource
    await applyRedactionGuardrail(chatMessage, dataSource)
    const newChatMessage = new ChatMessage()
    Object.assign(newChatMessage, chatMessage)
    if (!newChatMessage.createdDate) {
        newChatMessage.createdDate = new Date()
    }
    const chatmessage = await dataSource.getRepository(ChatMessage).create(newChatMessage)
    const dbResponse = await dataSource.getRepository(ChatMessage).save(chatmessage)
    return dbResponse
}
