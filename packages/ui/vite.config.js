import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import dotenv from 'dotenv'

export default defineConfig(async ({ mode }) => {
    let proxy = undefined
    if (mode === 'development') {
        const serverEnv = dotenv.config({ processEnv: {}, path: '../server/.env' }).parsed
        const serverHost = serverEnv?.['HOST'] ?? 'localhost'
        const serverPort = parseInt(serverEnv?.['PORT'] ?? 3000)
        if (!Number.isNaN(serverPort) && serverPort > 0 && serverPort < 65535) {
            proxy = {
                '^/api(/|$).*': {
                    target: `http://${serverHost}:${serverPort}`,
                    changeOrigin: true
                }
            }
        }
    }

    dotenv.config()
    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src'),
                '@codemirror/state': resolve(__dirname, '../../node_modules/@codemirror/state'),
                '@codemirror/view': resolve(__dirname, '../../node_modules/@codemirror/view'),
                '@codemirror/language': resolve(__dirname, '../../node_modules/@codemirror/language'),
                '@codemirror/lang-javascript': resolve(__dirname, '../../node_modules/@codemirror/lang-javascript'),
                '@codemirror/lang-json': resolve(__dirname, '../../node_modules/@codemirror/lang-json'),
                '@uiw/react-codemirror': resolve(__dirname, '../../node_modules/@uiw/react-codemirror'),
                '@uiw/codemirror-theme-vscode': resolve(__dirname, '../../node_modules/@uiw/codemirror-theme-vscode'),
                '@uiw/codemirror-theme-sublime': resolve(__dirname, '../../node_modules/@uiw/codemirror-theme-sublime'),
                '@lezer/common': resolve(__dirname, '../../node_modules/@lezer/common'),
                '@lezer/highlight': resolve(__dirname, '../../node_modules/@lezer/highlight')
            }
        },
        root: resolve(__dirname),
        build: {
            outDir: './build',
            // This is a single index.html for a client-routed SPA, so Vite can't tell which
            // route needs which lazy chunk — its default modulePreload injection just preloads
            // every chunk reachable anywhere in the dynamic-import graph on every page, which
            // silently defeats the manualChunks split below (the browser fetches
            // math-rendering/data-grid/etc. up front regardless of the page actually visited).
            modulePreload: false,
            rollupOptions: {
                output: {
                    // Without explicit manualChunks, Rollup's default heuristic hoists any
                    // dependency shared across many separately-lazy routes into the main
                    // entry chunk instead of keeping it as its own on-demand chunk — even
                    // though every consumer of these libraries is itself only reached via
                    // React.lazy(). That pushed ~5.4MB of narrowly-used libraries (math
                    // rendering, syntax highlighting, code/rich-text editors, the MUI data
                    // grid) into the chunk every page — including the pre-login marketing
                    // page — has to download and parse before first paint.
                    manualChunks(id) {
                        if (!id.includes('node_modules')) return undefined
                        if (id.includes('mathjax-full') || id.includes('rehype-mathjax')) return 'math-rendering'
                        if (id.includes('refractor')) return 'syntax-highlight'
                        if (
                            id.includes('@codemirror') ||
                            id.includes('@uiw/react-codemirror') ||
                            id.includes('@uiw/codemirror-theme') ||
                            id.includes('@lezer')
                        )
                            return 'code-editor'
                        if (id.includes('prosemirror-') || id.includes('@tiptap')) return 'rich-text-editor'
                        if (id.includes('@mui/x-data-grid') || id.includes('@mui/x-tree-view')) return 'data-grid'
                        if (id.includes('flowise-embed-react')) return 'embed-widget'
                        return undefined
                    }
                }
            }
        },
        server: {
            open: true,
            proxy,
            port: process.env.VITE_PORT ?? 8080,
            host: process.env.VITE_HOST
        }
    }
})
