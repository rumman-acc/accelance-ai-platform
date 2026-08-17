import PropTypes from 'prop-types'

// material-ui
import { List, Typography } from '@mui/material'

// project imports
import NavItem from '../NavItem'
import NavCollapse from '../NavCollapse'
import { useAuth } from '@/hooks/useAuth'

// ==============================|| SIDEBAR MENU LIST GROUP ||============================== //
// Renders a single menu-items/dashboard.js group (the one the header's SectionNav has made
// active) — the group switching/filtering itself lives in useMenuSections, shared with SectionNav.
// No repeated group-title caption here (dropped 2026-08-13, at the user's request) — the header's
// SectionNav tab already names the active section right above this list, so a second "Studio"
// label directly under it was pure redundant clutter, a leftover from when the sidebar stacked
// all 4 groups at once and needed a caption to tell them apart.
const NavGroup = ({ item }) => {
    const { hasPermission, hasDisplay } = useAuth()

    const shouldDisplayMenu = (menu) => {
        if (menu.permission && !hasPermission(menu.permission)) {
            return false
        }
        if (menu.display) {
            return hasDisplay(menu.display)
        }
        return true
    }

    const listItems = (menu, level = 1) => {
        if (!shouldDisplayMenu(menu)) return null

        switch (menu.type) {
            case 'collapse':
                return <NavCollapse key={menu.id} menu={menu} level={level} />
            case 'item':
                return <NavItem key={menu.id} item={menu} level={level} navType='MENU' />
            default:
                return (
                    <Typography key={menu.id} variant='h6' color='error' align='center'>
                        Menu Items Error
                    </Typography>
                )
        }
    }

    const visibleChildren = item.children.filter(shouldDisplayMenu)
    if (visibleChildren.length === 0) return null

    return (
        <List sx={{ p: '16px', py: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {visibleChildren.map((menu) => listItems(menu))}
        </List>
    )
}

NavGroup.propTypes = {
    item: PropTypes.object
}

export default NavGroup
