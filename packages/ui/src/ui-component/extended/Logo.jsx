import { useSelector } from 'react-redux'

// ==============================|| LOGO ||============================== //
// Envoy mark "2a — Courier E": three bars of an E, the middle bar leaves as
// an arrow (the two short accent bars). Solid colors, not the gradient used
// at hero sizes — this renders at ~24px, matching the design's own small-size
// (32px/20px) treatment rather than the 96px hero.

const Logo = () => {
    const customization = useSelector((state) => state.customization)
    const isDarkMode = customization.isDarkMode

    const strokeMain = isDarkMode ? '#FFFFFF' : '#0F74BD'
    const strokeAccent = '#13BA2F'
    const textColor = isDarkMode ? '#FFFFFF' : '#062667'

    return (
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row', gap: 8, marginLeft: '10px' }}>
            <svg width='24' height='24' viewBox='0 0 96 96' fill='none' aria-hidden='true'>
                <path d='M20 24 H70' stroke={strokeMain} strokeWidth='14' strokeLinecap='round' />
                <path d='M20 48 H46' stroke={strokeAccent} strokeWidth='14' strokeLinecap='round' />
                <path d='M66 48 H82' stroke={strokeAccent} strokeWidth='14' strokeLinecap='round' />
                <path d='M20 72 H70' stroke={strokeMain} strokeWidth='14' strokeLinecap='round' />
            </svg>
            <span
                style={{
                    fontFamily: "'Lexend', Roboto, Arial, sans-serif",
                    fontWeight: 500,
                    fontSize: 22,
                    letterSpacing: '-0.025em',
                    color: textColor
                }}
            >
                envoy
            </span>
        </div>
    )
}

export default Logo
