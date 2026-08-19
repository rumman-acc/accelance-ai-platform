import { Theme } from '@mui/material/styles';

export interface RoleColors {
    bg: string;
    color: string;
    border: string;
}
/**
 * Maps a chat message role (assistant, user, system, tool, ...) to a chip
 * color triple. Mirrors the legacy `getRoleColors` helper in
 * NodeExecutionDetails.jsx.
 */
export declare function getRoleColors(role: string, theme: Theme, isDarkMode: boolean): RoleColors;
