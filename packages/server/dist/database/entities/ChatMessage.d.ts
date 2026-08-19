import { IChatMessage, MessageType } from '../../Interface';
import { Execution } from './Execution';
export declare class ChatMessage implements IChatMessage {
    id: string;
    role: MessageType;
    chatflowid: string;
    executionId?: string;
    execution: Execution;
    content: string;
    sourceDocuments?: string;
    usedTools?: string;
    fileAnnotations?: string;
    agentReasoning?: string;
    reasonContent?: string;
    fileUploads?: string;
    artifacts?: string;
    action?: string | null;
    chatType: string;
    chatId: string;
    memoryType?: string;
    sessionId?: string;
    createdDate: Date;
    leadEmail?: string;
    followUpPrompts?: string;
}
