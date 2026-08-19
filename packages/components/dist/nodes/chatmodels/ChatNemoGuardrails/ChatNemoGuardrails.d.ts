import { type BaseChatModelParams } from '@langchain/core/language_models/chat_models';
import { BaseChatModelCallOptions } from '@langchain/core/language_models/chat_models';
export interface ChatNemoGuardrailsCallOptions extends BaseChatModelCallOptions {
    /**
     * An array of strings to stop on.
     */
    stop?: string[];
}
export interface ChatNemoGuardrailsInput extends BaseChatModelParams {
    configurationId?: string;
    /**
     * The host URL of the Nemo server.
     * @default "http://localhost:8000"
     */
    baseUrl?: string;
}
