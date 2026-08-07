import PropTypes from 'prop-types'
import { Box } from '@mui/material'

// ==============================|| ENVOY AUTH — CENTERED SHELL ||============================== //
// Plain platform sign in (/signin, no org slug in the URL — Envoy Auth.dc.html screen 3). No split
// brand panel here, unlike AuthSplitShell — the mockup is a single centered card on a soft wash.

const AuthCenteredShell = ({ children }) => (
    <Box
        sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            minHeight: '100vh',
            p: 3,
            background: 'linear-gradient(135deg, #F7FAFE 0%, #EAF1FB 100%)'
        }}
    >
        <Box
            sx={{
                width: '100%',
                maxWidth: '480px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                p: { xs: 4, sm: 6 },
                borderRadius: '24px',
                background: (theme) => theme.palette.background.paper,
                boxShadow: '0 4px 4px rgba(0,0,0,.1)'
            }}
        >
            {children}
        </Box>
    </Box>
)

AuthCenteredShell.propTypes = {
    children: PropTypes.node
}

export default AuthCenteredShell
