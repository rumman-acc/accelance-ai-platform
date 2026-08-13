import { useSelector } from 'react-redux'

// material-ui
import { Box } from '@mui/material'

// project imports
import SectionTabs from './SectionTabs'
import { useMenuSections } from '@/hooks/useMenuSections'

// ==============================|| HEADER SECTION NAV ||==============================
// Moves the sidebar's group headings (Build / Evaluations / User & Workspace Management /
// Others) into the top bar as switchable tabs, so the sidebar only ever shows the active
// group's items instead of all ~20 stacked and scrollable.
const SectionNav = () => {
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
    const { groups, activeSection, setActiveSection } = useMenuSections()

    if (!isAuthenticated || groups.length < 2) return null

    return (
        <Box
            sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                ml: 3
            }}
        >
            <SectionTabs groups={groups} activeSection={activeSection} onSelect={setActiveSection} variant='header' />
        </Box>
    )
}

export default SectionNav
