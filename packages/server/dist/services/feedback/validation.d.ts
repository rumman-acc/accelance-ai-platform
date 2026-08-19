import { IChatMessageFeedback } from '../../Interface';
import { ChatMessage } from '../../database/entities/ChatMessage';
import { ChatMessageFeedback } from '../../database/entities/ChatMessageFeedback';
/**
 * Validates that the message ID exists
 * @param {string} messageId
 */
export declare const validateMessageExists: (messageId: string) => Promise<ChatMessage>;
/**
 * Validates that the feedback ID exists
 * @param {string} feedbackId
 */
export declare const validateFeedbackExists: (feedbackId: string) => Promise<ChatMessageFeedback>;
/**
 * Validates a feedback object for creation
 * @param {Partial<IChatMessageFeedback>} feedback
 */
export declare const validateFeedbackForCreation: (feedback: Partial<IChatMessageFeedback>) => Promise<Partial<IChatMessageFeedback>>;
/**
 * Validates a feedback object for update
 * @param {string} feedbackId
 * @param {Partial<IChatMessageFeedback>} feedback
 */
export declare const validateFeedbackForUpdate: (feedbackId: string, feedback: Partial<IChatMessageFeedback>) => Promise<Partial<IChatMessageFeedback>>;
