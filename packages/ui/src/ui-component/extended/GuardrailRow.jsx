import PropTypes from 'prop-types'
import { Box, Stack, Tooltip, Typography } from '@mui/material'
import { SwitchInput } from '@/ui-component/switch/Switch'

/**
 * One catalog-entry row, shared by the per-agent canvas panel (GuardrailsCompliance.jsx) and the
 * standalone workspace page (views/guardrails/index.jsx) so their layout can't drift apart.
 * `minWidth: 0` on the text column plus `flexWrap` on the badge row are the actual fix for the
 * text-wrapping-into-a-single-narrow-column bug reported 2026-08-17 -- without them, a flex child
 * with no minWidth floors at its content's intrinsic width, and long titles/badges fight for space
 * by wrapping character-by-character instead of the badges simply dropping to a new line.
 */
const GuardrailRow = ({ testId, name, description, badges, hint, showSwitch, switchValue, switchDisabled, onToggle }) => (
    <Box
        data-testid={testId}
        sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1.5,
            p: 2,
            borderRadius: '8px',
            border: '1px solid',
            borderColor: 'divider'
        }}
    >
        <Box sx={{ flex: '1 1 320px', minWidth: 0 }}>
            <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' sx={{ rowGap: 0.75 }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>{name}</Typography>
                {badges.map((badge) => (
                    <Box
                        key={badge.label}
                        sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            bgcolor: badge.bg,
                            color: badge.color
                        }}
                    >
                        {badge.label}
                    </Box>
                ))}
            </Stack>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.75, lineHeight: 1.5 }}>{description}</Typography>
            {hint && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5, fontStyle: 'italic' }}>{hint}</Typography>}
        </Box>
        {showSwitch && (
            <Tooltip title={switchDisabled ? 'Not yet enforced by the runtime' : ''}>
                <Box sx={{ flexShrink: 0 }}>
                    <SwitchInput value={switchValue} disabled={switchDisabled} onChange={onToggle} />
                </Box>
            </Tooltip>
        )}
    </Box>
)

GuardrailRow.propTypes = {
    testId: PropTypes.string,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    badges: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            bg: PropTypes.string.isRequired,
            color: PropTypes.string.isRequired
        })
    ),
    hint: PropTypes.string,
    showSwitch: PropTypes.bool,
    switchValue: PropTypes.bool,
    switchDisabled: PropTypes.bool,
    onToggle: PropTypes.func
}

GuardrailRow.defaultProps = {
    badges: [],
    showSwitch: false,
    switchValue: false,
    switchDisabled: false
}

export default GuardrailRow
