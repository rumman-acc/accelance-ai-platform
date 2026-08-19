import { jsx as j } from 'react/jsx-runtime'
import { useRef as f, useEffect as c, useMemo as H } from 'react'
import { Box as S } from '@mui/material'
import { styled as T } from '@mui/material/styles'
import {
    M as w,
    i as $,
    a as L,
    b as z,
    u as B,
    g as U,
    c as X,
    d as _,
    e as v,
    f as E,
    h as q,
    E as F,
    t as s,
    j as P,
    k as W,
    p as I,
    l as J
} from './index-BAdEv8TI.mjs'
const p = _()
p.register('javascript', P)
p.register('json', W)
p.register('python', I)
p.register('typescript', J)
function x(t, o, i) {
    !i || v(o)
        ? t.commands.setContent(o, { emitUpdate: !1, contentType: 'html' })
        : (t.commands.setContent(E(o), { emitUpdate: !1, contentType: 'markdown' }),
          t.commands.setContent(q(t.getJSON()), { emitUpdate: !1 }))
}
const N = (t, o = !0) => [
        ...(o ? [w] : []),
        $.configure({ codeBlock: !1, ...(!o && { link: !1 }) }),
        L.configure({ lowlight: p, enableTabIndentation: !0, tabSize: 2 }),
        ...(t ? [z.configure({ placeholder: t })] : [])
    ],
    O = T(F, {
        shouldForwardProp: (t) => t !== 'rows'
    })(({ theme: t, rows: o, disabled: i }) => {
        const e = t.palette.mode === 'dark' ? 'dark' : 'light',
            r = s.colors.syntaxHighlight
        return {
            '& .ProseMirror': {
                padding: '10px 14px',
                height: o ? `${o * s.typography.rowHeightRem}rem` : `${s.typography.singleLineHeightRem}rem`,
                overflowY: o ? 'auto' : 'hidden',
                overflowX: o ? 'auto' : 'hidden',
                lineHeight: o ? `${s.typography.rowHeightRem}em` : `${s.typography.singleLineLineHeightEm}em`,
                fontSize: s.typography.fontSize.md,
                fontWeight: s.typography.fontWeight.medium,
                color: i ? t.palette.action.disabled : t.palette.text.primary,
                border: `1px solid ${s.colors.border.input[e]}`,
                borderRadius: '10px',
                backgroundColor: s.colors.background.input[e],
                boxSizing: 'border-box',
                whiteSpace: o ? 'pre-wrap' : 'nowrap',
                '&:hover': {
                    borderColor: i ? s.colors.border.input[e] : t.palette.text.primary,
                    cursor: i ? 'default' : 'text'
                },
                '&:focus': {
                    borderColor: i ? s.colors.border.input[e] : t.palette.primary.main,
                    outline: 'none'
                },
                // Block element spacing (ProseMirror resets default margins)
                '& p, & h1, & h2, & h3, & h4, & h5, & h6, & ul, & ol, & pre, & blockquote': {
                    margin: '0.75em 0'
                },
                // Only collapse margins on the very first/last child of the editor
                '& > :first-of-type': { marginTop: '0.25em' },
                '& > :last-of-type': { marginBottom: '0.25em' },
                // List indentation & item spacing
                '& ul, & ol': {
                    paddingLeft: '1.5em'
                },
                '& li': {
                    marginBottom: '0.25em'
                },
                '& li > p': {
                    margin: '0.25em 0'
                },
                // Placeholder styling
                '& p.is-editor-empty:first-of-type::before': {
                    content: 'attr(data-placeholder)',
                    float: 'left',
                    color: i ? t.palette.action.disabled : t.palette.text.primary,
                    opacity: i ? 0.6 : 0.4,
                    pointerEvents: 'none',
                    height: 0
                },
                // Code block styling
                '& pre': {
                    backgroundColor: r.background[e],
                    color: r.text[e],
                    borderRadius: '8px',
                    padding: '0.75em 1em',
                    overflow: 'auto',
                    '& code': {
                        fontFamily: 'monospace',
                        fontSize: '0.9em'
                    }
                },
                // Syntax highlight colors (lowlight adds .hljs-* classes)
                '& .hljs-comment, & .hljs-quote': { color: r.comment[e] },
                '& .hljs-variable, & .hljs-template-variable, & .hljs-attr': { color: r.variable[e] },
                '& .hljs-number, & .hljs-literal': { color: r.number[e] },
                '& .hljs-string, & .hljs-regexp': { color: r.string[e] },
                '& .hljs-title, & .hljs-section, & .hljs-selector-id': { color: r.title[e] },
                '& .hljs-keyword, & .hljs-selector-tag, & .hljs-built_in': { color: r.keyword[e] },
                '& .hljs-operator, & .hljs-symbol': { color: r.operator[e] },
                '& .hljs-punctuation': { color: r.punctuation[e] }
            }
        }
    })
function G({ value: t, onChange: o, placeholder: i, disabled: e = !1, rows: r, autoFocus: y = !1, onEditorReady: l, useMarkdown: a = !0 }) {
    const g = f(o)
    c(() => {
        g.current = o
    }, [o])
    const m = f(t || ''),
        u = f(t),
        k = f(a),
        C = H(() => N(i, a), [i, a]),
        n = B({
            extensions: C,
            content: '',
            editable: !e,
            autofocus: y ? 'end' : !1,
            onUpdate: ({ editor: h }) => {
                const d = a ? U(h) : h.getHTML(),
                    b = a ? X(d) : d
                ;(m.current = b), g.current(b)
            }
        })
    return (
        c(() => (l == null || l(n), () => (l == null ? void 0 : l(null))), [n, l]),
        c(() => {
            !n || !u.current || (x(n, u.current, k.current), (m.current = u.current))
        }, [n]),
        c(() => {
            n && t !== m.current && (x(n, t, a), (m.current = t))
        }, [n, t, a]),
        c(() => {
            n && n.setEditable(!e)
        }, [n, e]),
        /* @__PURE__ */ j(S, { 'data-testid': 'rich-text-editor', children: /* @__PURE__ */ j(O, { editor: n, rows: r, disabled: e }) })
    )
}
export { G as RichTextEditor }
