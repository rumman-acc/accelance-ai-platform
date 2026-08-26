import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'

// ==============================|| LOGO ||============================== //
// Fluid mark "2a — Courier E" (renamed 2026-08-26, was Envoy; geometry unchanged — see
// DESIGN_SPEC.md Section 9 for the flagged letterform mismatch): three bars of an E, the middle bar leaves as
// an arrow (the two short accent bars). Solid colors, not the gradient used
// at hero sizes — this renders at ~24px, matching the design's own small-size
// (32px/20px) treatment rather than the 96px hero.
//
// `variant` lets callers force the light-on-dark or dark-on-light treatment
// (e.g. the Envoy Auth split-panel brand side is always white-on-gradient
// regardless of the app's dark-mode setting) instead of following it.

const Logo = ({ variant = 'auto', size = 24 }) => {
    const customization = useSelector((state) => state.customization)
    const isLight = variant === 'auto' ? customization.isDarkMode : variant === 'light'

    const strokeMain = isLight ? '#FFFFFF' : '#0F74BD'
    const strokeAccent = '#13BA2F'
    const textColor = isLight ? '#FFFFFF' : '#062667'

    return (
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row', gap: 8 }}>
            <svg width={size} height={size} viewBox='0 0 96 96' fill='none' aria-hidden='true'>
                <path d='M20 24 H70' stroke={strokeMain} strokeWidth='14' strokeLinecap='round' />
                <path d='M20 48 H46' stroke={strokeAccent} strokeWidth='14' strokeLinecap='round' />
                <path d='M66 48 H82' stroke={strokeAccent} strokeWidth='14' strokeLinecap='round' />
                <path d='M20 72 H70' stroke={strokeMain} strokeWidth='14' strokeLinecap='round' />
            </svg>
            <span
                style={{
                    fontFamily: "'Lexend', Roboto, Arial, sans-serif",
                    fontWeight: 500,
                    fontSize: Math.round(size * 0.92),
                    letterSpacing: '-0.025em',
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
