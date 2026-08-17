import { Outlet } from 'react-router-dom'

// material-ui
import { styled, useTheme } from '@mui/material/styles'
import { Box, CssBaseline } from '@mui/material'

// project imports
import AccelanceHeader from '@/design-system/accelance-shell/AccelanceHeader'
import AccelanceSidebar from '@/design-system/accelance-shell/AccelanceSidebar'

// styles
// theme.typography.mainContent's ambient padding is kept — every not-yet-migrated MUI page still
// depends on it for its own page padding (see migration-checklist.md row 24's follow-up: Control
// Tower's rebuild double-padded when it also added its own). But its marginTop/marginRight/
// minHeight were sized for the *old* layout's `position: fixed` AppBar (marginTop: 75px pushed
// content out from under a header that overlaid the page) — AccelanceHeader is a normal in-flow
// flex item now, nothing overlays anything, so that margin was pure dead space above every page's
// heading. Overridden back out here rather than in the shared theme value, since nothing else
// reads theme.typography.mainContent.
const Main = styled('main')(({ theme }) => ({
    ...theme.typography.mainContent,
    marginTop: 0,
    marginRight: 0,
    minHeight: 'auto',
    flex: 1,
    minWidth: 0,
    overflowY: 'auto',
    background: 'var(--accelance-white)'
}))

// ==============================|| MAIN LAYOUT ||============================== //
// App shell rebuilt to match ControlTower.dc.html (pulled via DesignSync 2026-08-14), at the
// user's explicit direction to use that design for the whole app, not just Control Tower's own
// content — see design-system/accelance-shell/ and DESIGN_SPEC.md Section 9. The old MUI
// Header/Sidebar (this file's previous AppBar+Drawer+SET_MENU-toggle implementation,
// migration-checklist.md rows 1/23) are left in place, unused, for reference/rollback rather than
// deleted — Sidebar.jsx, Header/index.jsx, and everything under Sidebar/MenuList/ no longer have
// any import path into the running app. The source mockup has no responsive/mobile treatment
// (explicit `min-width: 1320px` on its own root) — the old layout's hamburger-toggle/temporary-
// drawer mobile behavior is not carried over; this is a known, flagged gap, not a silent drop.
const MainLayout = () => {
    const theme = useTheme()

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <CssBaseline />
            <AccelanceHeader />
            <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
                <AccelanceSidebar />
                <Main theme={theme}>
                    <Outlet />
                </Main>
            </Box>
        </Box>
    )
}

export default MainLayout
