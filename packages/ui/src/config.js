const config = {
    // basename: only at build time to set, and Don't add '/' at end off BASENAME for breadcrumbs, also Don't put only '/' use blank('') instead,
    basename: '',
    defaultPath: '/control-tower',
    // You can specify multiple fallback fonts
    // Per design-system/tokens.json (accelance design system): Inter primary, Arial corporate fallback
    fontFamily: `'Inter', 'Arial', sans-serif`,
    // Per design-system/tokens.json radius token (8px universal) — was a user-adjustable 12 default
    borderRadius: 8
}

export default config
