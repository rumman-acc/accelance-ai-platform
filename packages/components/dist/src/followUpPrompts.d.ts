import { FollowUpPromptConfig, ICommonObject } from './Interface';
export interface FollowUpPromptResult {
    questions: string[];
}
export declare const generateFollowUpPrompts: (followUpPromptsConfig: FollowUpPromptConfig, apiMessageContent: string, options: ICommonObject) => Promise<FollowUpPromptResult | undefined>;
