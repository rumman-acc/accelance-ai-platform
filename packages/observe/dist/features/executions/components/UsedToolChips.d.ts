import { SxProps, Theme } from '@mui/material';
import { UsedToolEntry } from '../../../core/types';

interface UsedToolChipsProps {
    tools: UsedToolEntry[];
    sx?: SxProps<Theme>;
}
export declare function UsedToolChips({ tools, sx }: UsedToolChipsProps): import("react/jsx-runtime").JSX.Element | null;
export {};
