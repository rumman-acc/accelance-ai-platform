import PropTypes from 'prop-types'
import { Box, Stack, Typography, useTheme } from '@mui/material'

import Logo from '@/ui-component/extended/Logo'

// ==============================|| ENVOY AUTH — SPLIT BRAND SHELL ||============================== //
// Shared by organization setup, org-scoped sign in, and invite-accept register — the three auth
// screens that carry the gradient brand panel (Envoy Auth.dc.html screens 1/2/4). Screen 3 (plain
// /signin, no org in the URL) uses AuthCenteredShell instead, since its mockup has no split panel.
// Panel hides below `md` so the form gets full width on tablet/mobile.

const AuthSplitShell = ({ headline, subtitle, panelExtra, children }) => {
    const theme = useTheme()

    return (
        <Box
            sx={{
                display: 'flex',
                width: '100%',
                minHeight: '100vh',
                background: theme.palette.background.paper
            }}
        >
            <Box
                sx={{
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                    width: { md: '380px', lg: '480px' },
                    gap: 4,
                    p: { md: 5, lg: 6 },
                    background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
                }}
            >
                <Logo variant='light' size={34} />

                <Stack sx={{ gap: 3 }}>
                    <Typography sx={{ fontSize: { md: '32px', lg: '40px' }, lineHeight: 1.25, fontWeight: 300, color: '#fff' }}>
                        {headline}
                    </Typography>
                    <Typography sx={{ fontSize: '18px', lineHeight: 1.6, fontWeight: 300, color: 'rgba(255,255,255,0.75)' }}>
                        {subtitle}
                    </Typography>
                </Stack>

                {panelExtra && (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            p: 3,
                            borderRadius: '24px',
                            background: 'linear-gradient(135deg, rgba(255,255,255,.22), rgba(255,255,255,.1))',
                            border: '1px solid rgba(255,255,255,.3)',
                            backdropFilter: 'blur(12px)'
                        }}
                    >
                        {panelExtra}
                    </Box>
                )}
            </Box>

            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: { xs: 3, sm: 5, md: 6 }
                }}
            >
                <Box sx={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: 3 }}>{children}</Box>
            </Box>
        </Box>
    )
}

AuthSplitShell.propTypes = {
    headline: PropTypes.node,
    subtitle: PropTypes.node,
    panelExtra: PropTypes.node,
    children: PropTypes.node
}

export default AuthSplitShell
