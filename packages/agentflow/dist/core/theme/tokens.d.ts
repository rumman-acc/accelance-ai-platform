/**
 * Design Tokens for Agentflow
 *
 * Single source of truth for all design values (colors, spacing, shadows, etc.)
 * These tokens are used by both MUI theme and CSS variables.
 *
 * Architecture:
 * 1. Base colors - Primitive color values (single source of truth)
 * 2. Semantic colors - Referenced from base colors for consistency
 *
 * Base palette and node type colors are duplicated in
 * packages/observe/src/core/theme/tokens.ts — keep in sync until
 * extracted to packages/shared-ui in FLOWISE-628. Agentflow extends
 * the shared base with ReactFlow + syntax highlight tokens, which stay here.
 */
export declare const tokens: {
    readonly colors: {
        readonly nodes: {
            readonly condition: '#FFB938'
            readonly start: '#7EE787'
            readonly llm: '#64B5F6'
            readonly agent: '#4DD0E1'
            readonly humanInput: '#6E6EFD'
            readonly loop: '#FFA07A'
            readonly directReply: '#4DDBBB'
            readonly customFunction: '#E4B7FF'
            readonly tool: '#d4a373'
            readonly retriever: '#b8bedd'
            readonly conditionAgent: '#ff8fab'
            readonly stickyNote: '#fee440'
            readonly http: '#FF7F7F'
            readonly iteration: '#9C89B8'
            readonly executeFlow: '#a3b18a'
        }
        readonly background: {
            readonly canvas: {
                readonly light: '#f8f9fa'
                readonly dark: '#1a1a1a'
            }
            readonly palette: {
                readonly light: '#fafafa'
                readonly dark: '#252525'
            }
            readonly card: {
                readonly light: '#fff'
                readonly dark: '#23262c'
            }
            readonly cardHover: {
                readonly light: '#f5f5f5'
                readonly dark: '#404040'
            }
            readonly header: {
                readonly light: '#fff'
                readonly dark: '#2d2d2d'
            }
            readonly input: {
                readonly light: '#fafafa'
                readonly dark: '#32353b'
            }
            readonly optionHover: {
                readonly light: ''
                readonly dark: '#233345'
            }
            readonly listItemSelected: {
                readonly light: ''
                readonly dark: '#454c59'
            }
        }
        readonly border: {
            readonly default: {
                readonly light: '#e0e0e0'
                readonly dark: 'rgba(255, 255, 255, 0.145)'
            }
            readonly hover: {
                readonly light: '#bdbdbd'
                readonly dark: '#525252'
            }
            readonly input: {
                readonly light: '#21212125'
                readonly dark: '#888'
            }
            readonly validation: '#FFB938'
        }
        readonly text: {
            readonly primary: {
                readonly light: '#333'
                readonly dark: '#fff'
            }
            readonly secondary: {
                readonly light: '#666'
                readonly dark: '#9e9e9e'
            }
            readonly tertiary: {
                readonly light: '#757575'
                readonly dark: '#9e9e9e'
            }
        }
        readonly palette: {
            readonly primary: {
                readonly light: '#e3f2fd'
                readonly main: '#2196f3'
                readonly dark: '#1e88e5'
            }
            readonly secondary: {
                readonly light: {
                    readonly light: '#ede7f6'
                    readonly dark: '#454c59'
                }
                readonly main: {
                    readonly light: '#673ab7'
                    readonly dark: '#7c4dff'
                }
                readonly dark: {
                    readonly light: '#5e35b1'
                    readonly dark: '#ffffff'
                }
            }
            readonly success: {
                readonly light: '#cdf5d8'
                readonly main: '#00e676'
                readonly dark: '#00c853'
            }
            readonly error: {
                readonly light: '#f3d2d2'
                readonly main: '#f44336'
                readonly dark: '#c62828'
            }
            readonly warning: {
                readonly light: '#fff8e1'
                readonly main: '#ffe57f'
                readonly dark: '#ffc107'
            }
        }
        readonly semantic: {
            readonly success: '#4caf50'
            readonly error: '#f44336'
            readonly warning: '#ff9800'
            readonly warningBg: '#fefcbf'
            readonly warningText: '#744210'
            readonly info: '#2196f3'
            readonly syncNodesFab: '#ffa500'
        }
        readonly reactflow: {
            readonly minimap: {
                readonly node: {
                    readonly light: '#e2e2e2'
                    readonly dark: '#2d2d2d'
                }
                readonly nodeStroke: {
                    readonly light: '#fff'
                    readonly dark: '#525252'
                }
                readonly background: {
                    readonly light: '#fff'
                    readonly dark: '#1a1a2e'
                }
                readonly mask: {
                    readonly light: 'rgba(240, 240, 240, 0.6)'
                    readonly dark: 'rgba(45, 45, 45, 0.6)'
                }
            }
            readonly background: {
                readonly dots: {
                    readonly light: '#aaa'
                    readonly dark: '#555'
                }
            }
        }
        readonly syntaxHighlight: {
            readonly background: {
                readonly light: '#f5f5f5'
                readonly dark: '#2d2d2d'
            }
            readonly text: {
                readonly light: '#333333'
                readonly dark: '#d4d4d4'
            }
            readonly comment: {
                readonly light: '#6a9955'
                readonly dark: '#6a9955'
            }
            readonly variable: {
                readonly light: '#d73a49'
                readonly dark: '#9cdcfe'
            }
            readonly number: {
                readonly light: '#e36209'
                readonly dark: '#b5cea8'
            }
            readonly string: {
                readonly light: '#22863a'
                readonly dark: '#ce9178'
            }
            readonly title: {
                readonly light: '#6f42c1'
                readonly dark: '#dcdcaa'
            }
            readonly keyword: {
                readonly light: '#005cc5'
                readonly dark: '#569cd6'
            }
            readonly operator: {
                readonly light: '#333333'
                readonly dark: '#d4d4d4'
            }
            readonly punctuation: {
                readonly light: '#333333'
                readonly dark: '#d4d4d4'
            }
        }
        readonly gradients: {
            readonly generate: {
                readonly default: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)'
                readonly hover: 'linear-gradient(45deg, #FF8E53 30%, #FF6B6B 90%)'
            }
        }
    }
    readonly spacing: {
        readonly xs: 4
        readonly sm: 8
        readonly md: 12
        readonly lg: 16
        readonly xl: 20
        readonly xxl: 24
    }
    readonly shadows: {
        readonly card: '0 2px 8px rgba(0, 0, 0, 0.1)'
        readonly toolbar: {
            readonly light: '0 2px 14px 0 rgb(32 40 45 / 8%)'
            readonly dark: '0 2px 14px 0 rgb(0 0 0 / 20%)'
        }
        readonly minimap: '0 2px 8px rgba(0, 0, 0, 0.1)'
        readonly controls: '0 2px 8px rgba(0, 0, 0, 0.1)'
        readonly stickyNote: '0 2px 4px rgba(0, 0, 0, 0.1)'
    }
    readonly typography: {
        readonly fontSize: {
            readonly xs: '0.625rem'
            readonly sm: '0.75rem'
            readonly md: '0.875rem'
            readonly lg: '1rem'
        }
        readonly fontWeight: {
            readonly regular: 400
            readonly medium: 500
            readonly semibold: 600
        }
        /** Matches MUI OutlinedInput's default line-height (1.4375em) so the
         *  RichTextEditor aligns with standard TextField height at the same row count. */
        readonly rowHeightRem: 1.4375
        /** Single-line editor height — approximates MUI small input (38.4px) */
        readonly singleLineHeightRem: 2.4
        /** Tighter line-height for single-line mode to vertically center text */
        readonly singleLineLineHeightEm: 0.875
    }
    readonly borderRadius: {
        readonly sm: 4
        readonly md: 8
        readonly lg: 12
        readonly round: '50%'
    }
    readonly zIndex: {
        readonly canvasButton: 10
        readonly canvasPanel: 20
        readonly iterationEdge: 9999
    }
}
export type Tokens = typeof tokens
