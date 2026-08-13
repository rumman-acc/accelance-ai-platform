import PropTypes from 'prop-types'

// material-ui
import { Box, ButtonBase, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// ==============================|| SECTION TABS ||==============================
// Presentational row of section switchers. Styled after the design system's TopNav link
// state (design-system/components/component-inventory.md: "hover = blue underline fade-in
// on links") applied to the app's Sidebar groups instead of marketing links — that specific
// combination isn't in the source Claude Design project yet (logged as a gap, see
// DESIGN_SPEC.md Section 9), so this reuses the existing token/motion rules rather than
// inventing a new visual language. Used in the header (desktop) and atop the drawer (mobile).
const SectionTabs = ({ groups, activeSection, onSelect, variant }) => {
    const theme = useTheme()
    const isDrawer = variant === 'drawer'

    return (
        <Box
            role='tablist'
            aria-label='Menu sections'
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: isDrawer ? 2 : 3,
                px: isDrawer ? 2 : 0,
                py: isDrawer ? 1.5 : 0,
                overflowX: isDrawer ? 'auto' : 'visible',
                borderBottom: isDrawer ? '1px solid' : 'none',
                borderColor: theme.palette.divider
            }}
        >
            {groups.map((group) => {
                const Icon = group.icon
                const isActive = group.id === activeSection
                return (
                    <ButtonBase
                        key={group.id}
                        role='tab'
                        aria-selected={isActive}
                        onClick={() => onSelect(group.id)}
                        sx={{
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                            py: 0.75,
                            borderBottom: '2px solid',
                            borderColor: isActive ? theme.palette.primary.main : 'transparent',
                            color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                            transition: theme.transitions.create(['color', 'border-color'], { duration: 300 }),
                            '&:hover': {
                                color: theme.palette.primary.main,
                                borderColor: theme.palette.primary.light
                            }
                        }}
                    >
                        {Icon && <Icon stroke={1.5} size='1.1rem' />}
                        <Typography variant='body1' sx={{ fontWeight: isActive ? 700 : 400, whiteSpace: 'nowrap' }}>
                            {group.title}
                        </Typography>
                    </ButtonBase>
                )
            })}
        </Box>
    )
}

SectionTabs.propTypes = {
    groups: PropTypes.array.isRequired,
    activeSection: PropTypes.string,
    onSelect: PropTypes.func.isRequired,
    variant: PropTypes.oneOf(['header', 'drawer'])
}

SectionTabs.defaultProps = {
    variant: 'header'
}

export default SectionTabs
