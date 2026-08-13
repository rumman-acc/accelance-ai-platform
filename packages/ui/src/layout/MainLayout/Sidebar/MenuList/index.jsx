import PropTypes from 'prop-types'

// material-ui
import { Box } from '@mui/material'

// project imports
import NavGroup from './NavGroup'
import SectionTabs from '@/layout/MainLayout/Header/SectionNav/SectionTabs'
import { useMenuSections } from '@/hooks/useMenuSections'

// ==============================|| SIDEBAR MENU LIST ||============================== //
// Shows only the active section's items (see useMenuSections/SectionNav) instead of every
// group stacked and scrollable. Below `md` there's no room for the header's SectionNav, so
// the same section tabs render inline at the top of the drawer instead.
const MenuList = ({ showSectionTabs }) => {
    const { groups, activeGroup, activeSection, setActiveSection } = useMenuSections()

    if (!activeGroup) return null

    return (
        <Box>
            {showSectionTabs && groups.length > 1 && (
                <SectionTabs groups={groups} activeSection={activeSection} onSelect={setActiveSection} variant='drawer' />
            )}
            <NavGroup item={activeGroup} />
        </Box>
    )
}

MenuList.propTypes = {
    showSectionTabs: PropTypes.bool
}

export default MenuList
