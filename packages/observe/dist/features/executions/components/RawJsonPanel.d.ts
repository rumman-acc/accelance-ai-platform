interface RawJsonPanelProps {
    src: object;
    isDarkMode: boolean;
}
/**
 * Raw JSON tree viewer used by NodeExecutionDetail's "Raw" tab. Wraps
 * `flowise-react-json-view` with the bordered frame + theme switch + a
 * pretty-printing clipboard handler.
 */
export declare function RawJsonPanel({ src, isDarkMode }: RawJsonPanelProps): import("react/jsx-runtime").JSX.Element;
export {};
