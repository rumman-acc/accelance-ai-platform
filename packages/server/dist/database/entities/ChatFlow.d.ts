import { ChatflowType, IChatFlow } from '../../Interface';
export declare enum EnumChatflowType {
    CHATFLOW = "CHATFLOW",
    AGENTFLOW = "AGENTFLOW",
    MULTIAGENT = "MULTIAGENT",
    ASSISTANT = "ASSISTANT"
}
export declare class ChatFlow implements IChatFlow {
    id: string;
    name: string;
    flowData: string;
    deployed?: boolean;
    isPublic?: boolean;
    apikeyid?: string;
    chatbotConfig?: string;
    apiConfig?: string;
    analytic?: string;
    speechToText?: string;
    textToSpeech?: string;
    followUpPrompts?: string;
    category?: string;
    type?: ChatflowType;
    createdDate: Date;
    updatedDate: Date;
    mcpServerConfig?: string;
    webhookSecret?: string | null;
    webhookSecretConfigured?: boolean;
    workspaceId: string;
}
