import { AssistantType, IAssistant } from '../../Interface';
export declare class Assistant implements IAssistant {
    id: string;
    details: string;
    credential: string;
    iconSrc?: string;
    type?: AssistantType;
    createdDate: Date;
    updatedDate: Date;
    workspaceId: string;
}
