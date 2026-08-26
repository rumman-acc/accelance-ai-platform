import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'

// ==============================|| LOGO ||============================== //
// Fluid mark "1b — Branch" (adopted 2026-08-27 from the "Fluid Logo" Claude Design
// exploration, replacing the Envoy-era three-bar "E" and closing the letterform gap
// flagged in DESIGN_SPEC.md Section 9): a node-and-edge bubble graph — a deep-blue core
// branching up-left (azure) and up-right (green), reading as an agent dispatching to
// tools. This is the design's own small-size (24-40px) flat-color treatment, not the
// gradient/edge-path version used at hero sizes (see the landing page mark for that).
//
// `variant` lets callers force the light-on-dark or dark-on-light treatment
// (e.g. the auth split-panel brand side is always white-on-gradient regardless of the
// app's dark-mode setting) instead of following it.

const Logo = ({ variant = 'auto', size = 24 }) => {
    const customization = useSelector((state) => state.customization)
    const isLight = variant === 'auto' ? customization.isDarkMode : variant === 'light'

    const nodeMain = isLight ? '#FFFFFF' : '#0F74BD'
    const nodeCore = isLight ? '#FFFFFF' : '#062667'
    const coreOpacity = isLight ? 0.55 : 1
    const nodeAccent = '#13BA2F'
    const textColor = isLight ? '#FFFFFF' : '#062667'

    return (
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row', gap: 8 }}>
            <svg width={size} height={size} viewBox='0 0 200 200' fill='none' aria-hidden='true'>
                <circle cx='40' cy='36' r='22' fill={nodeMain} />
                <circle cx='160' cy='36' r='26' fill={nodeAccent} />
                <circle cx='96' cy='96' r='38' fill={nodeCore} opacity={coreOpacity} />
                <ellipse cx='81' cy='80' rx='12' ry='7' fill='#FFFFFF' opacity='0.35' transform='rotate(-25,81,80)' />
                <circle cx='26' cy='158' r='20' fill={nodeMain} opacity='0.8' />
            </svg>
            <span
                style={{
                    fontFamily: "'Lexend', Roboto, Arial, sans-serif",
                    fontWeight: 300,
                    fontSize: Math.round(size * 0.92),
                    letterSpacing: '-0.02em',
                    color: textColor
                }}
            >
                fluid
            </span>
        </div>
    )
}

Logo.propTypes = {
    variant: PropTypes.oneOf(['auto', 'light', 'dark']),
    size: PropTypes.number
}

export default Logo
