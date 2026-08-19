import { SxProps, Theme } from '@mui/material';
import { AvailableToolEntry, ChatMessage } from '../../../core/types';

interface ChatMessageBubbleProps {
    message: ChatMessage;
    isDarkMode: boolean;
    sx?: SxProps<Theme>;
    availableTools?: AvailableToolEntry[];
    apiBaseUrl?: string;
}
export declare function ChatMessageBubble({ message, isDarkMode, sx, availableTools, apiBaseUrl }: ChatMessageBubbleProps): import("react/jsx-runtime").JSX.Element;
export {};
