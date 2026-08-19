/**
 * Design Tokens for @accelance/observe.
 *
 * Base palette and node type colors below are duplicated in
 * packages/agentflow/src/core/theme/tokens.ts — keep in sync until
 * extracted to packages/shared-ui in FLOWISE-628. Each package
 * extends the shared base with its own specifics (agentflow: ReactFlow,
 * syntax highlight; observe: observe-specific semantics).
 */
export declare const tokens: {
    readonly borderRadius: {
        readonly lg: 12;
        readonly md: 8;
        readonly round: "50%";
        readonly sm: 4;
    };
    readonly colors: {
        readonly background: {
            readonly canvas: {
                readonly dark: "#1a1a1a";
                readonly light: "#f8f9fa";
            };
            readonly card: {
                readonly dark: "#2d2d2d";
                readonly light: "#fff";
            };
            readonly cardHover: {
                readonly dark: "#404040";
                readonly light: "#f5f5f5";
            };
            readonly sidebar: {
                readonly dark: "#252525";
                readonly light: "#fafafa";
            };
        };
        readonly border: {
            readonly default: {
                readonly dark: "#404040";
                readonly light: "#e0e0e0";
            };
            readonly hover: {
                readonly dark: "#525252";
                readonly light: "#bdbdbd";
            };
        };
        readonly jsonViewer: {
            readonly boolean: {
                readonly dark: "#569cd6";
                readonly light: "#0000ff";
            };
            readonly key: {
                readonly dark: "#ff5733";
                readonly light: "#ff5733";
            };
            readonly null: {
                readonly dark: "#d4d4d4";
                readonly light: "#ff00ff";
            };
            readonly number: {
                readonly dark: "#b5cea8";
                readonly light: "#ff8c00";
            };
            readonly string: {
                readonly dark: "#9cdcfe";
                readonly light: "#008000";
            };
        };
        readonly metrics: {
            readonly cost: "#c49331";
        };
        readonly nodes: {
            readonly agent: "#4DD0E1";
            readonly condition: "#FFB938";
            readonly conditionAgent: "#ff8fab";
            readonly customFunction: "#E4B7FF";
            readonly directReply: "#4DDBBB";
            readonly executeFlow: "#a3b18a";
            readonly http: "#FF7F7F";
            readonly humanInput: "#6E6EFD";
            readonly iteration: "#9C89B8";
            readonly llm: "#64B5F6";
            readonly loop: "#FFA07A";
            readonly retriever: "#b8bedd";
            readonly start: "#7EE787";
            readonly stickyNote: "#fee440";
            readonly tool: "#d4a373";
        };
        readonly palette: {
            readonly error: {
                readonly dark: "#c62828";
                readonly light: "#f3d2d2";
                readonly main: "#f44336";
            };
            readonly primary: {
                readonly dark: "#1e88e5";
                readonly light: "#e3f2fd";
                readonly main: "#2196f3";
            };
            readonly secondary: {
                readonly dark: "#5e35b1";
                readonly light: "#ede7f6";
                readonly main: "#673ab7";
            };
            readonly success: {
                readonly dark: "#00c853";
                readonly light: "#cdf5d8";
                readonly main: "#00e676";
            };
            readonly warning: {
                readonly dark: "#ffc107";
                readonly light: "#fff8e1";
                readonly main: "#ffe57f";
            };
        };
        readonly semantic: {
            readonly error: "#f44336";
            readonly info: "#2196f3";
            readonly success: "#4caf50";
            readonly warning: "#ff9800";
            readonly warningBg: "#fefcbf";
            readonly warningText: "#744210";
        };
        readonly text: {
            readonly primary: {
                readonly dark: "#fff";
                readonly light: "#666";
            };
            readonly secondary: {
                readonly dark: "#9e9e9e";
                readonly light: "#9e9e9e";
            };
            readonly tertiary: {
                readonly dark: "#9e9e9e";
                readonly light: "#757575";
            };
        };
    };
    readonly shadows: {
        readonly card: "0 2px 8px rgba(0, 0, 0, 0.1)";
        readonly toolbar: {
            readonly dark: "0 2px 14px 0 rgb(0 0 0 / 20%)";
            readonly light: "0 2px 14px 0 rgb(32 40 45 / 8%)";
        };
    };
    readonly spacing: {
        readonly lg: 16;
        readonly md: 12;
        readonly sm: 8;
        readonly xl: 20;
        readonly xs: 4;
        readonly xxl: 24;
    };
};
export type Tokens = typeof tokens;
