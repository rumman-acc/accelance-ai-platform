/**
 * Tailwind config generated from design-system/tokens.json (accelance design system,
 * pulled via DesignSync 2026-07-27). Do not add colors/spacing/radii here that aren't
 * in tokens.json — see CLAUDE.md hard rule 2.
 *
 * `corePlugins.preflight` is disabled: this app is mid-migration from MUI to
 * Tailwind/shadcn (see DESIGN_SPEC.md Section 9 tech-stack gap). MUI's CssBaseline
 * still owns the global reset for unmigrated pages; Tailwind is scoped to utility
 * classes only until the migration is complete.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
    corePlugins: {
        preflight: false
    },
    theme: {
        extend: {
            colors: {
                primary: { DEFAULT: '#0052CC', dark: '#003A8F' },
                success: '#1A7A4A',
                alert: '#D5680B',
                compliance: '#0891B5',
                body: '#6B6B6B',
                tint: '#C8D8EC',
                'off-white': '#F8FAFC',
                border: '#E2E8F0',
                muted: '#94A3B8',
                agent: {
                    autonomous: '#1A7A4A',
                    review: '#B45309',
                    approval: '#B91C1C'
                }
            },
            fontFamily: {
                sans: ['Inter', 'Arial', 'sans-serif']
            },
            fontSize: {
                h1: ['48px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
                h2: ['36px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '700' }],
                h3: ['24px', { lineHeight: '1.4', fontWeight: '700' }],
                h4: ['20px', { lineHeight: '1.4', fontWeight: '700' }],
                h5: ['16px', { lineHeight: '1.5', fontWeight: '700' }],
                'body-lg': ['18px', { lineHeight: '1.6' }],
                body: ['16px', { lineHeight: '1.6' }],
                small: ['14px', { lineHeight: '1.5' }],
                caption: ['12px', { lineHeight: '1.4', letterSpacing: '0.05em' }],
                button: ['16px', { lineHeight: '1', letterSpacing: '0.02em', fontWeight: '700' }],
                label: ['14px', { lineHeight: '1.4', letterSpacing: '0.02em' }]
            },
            spacing: {
                1: '8px',
                2: '16px',
                3: '24px',
                4: '32px',
                5: '48px',
                6: '64px'
            },
            borderRadius: {
                DEFAULT: '8px',
                brand: '8px'
            },
            boxShadow: {
                subtle: '0 1px 3px rgba(0,0,0,0.1)',
                elevated: '0 4px 12px rgba(0,0,0,0.15)'
            },
            backgroundImage: {
                'brand-gradient': 'linear-gradient(135deg, #0052CC 0%, #003A8F 100%)'
            },
            maxWidth: {
                grid: '1200px'
            },
            transitionDuration: {
                DEFAULT: '300ms'
            }
        }
    },
    plugins: []
}
