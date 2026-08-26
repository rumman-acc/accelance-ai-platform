import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

// project imports
import { useMenuSections } from '@/hooks/useMenuSections'
import OrgWorkspaceBreadcrumbs from '@/layout/MainLayout/Header/OrgWorkspaceBreadcrumbs'
import ProfileSection from '@/layout/MainLayout/Header/ProfileSection'
import useApi from '@/hooks/useApi'
import accountApi from '@/api/account.api'
import { store } from '@/store'
import { logoutSuccess } from '@/store/reducers/authSlice'
import { SECTION_TAB_ICONS } from './icons'
import './shell.css'

// ==============================|| ACCELANCE HEADER ||==============================
// Matches ControlTower.dc.html's <header> — see AccelanceSidebar.jsx for the same provenance
// note. Section tabs reuse the exact useMenuSections data/logic already built (migration-
// checklist.md row 23); only the visual language changed (underline tab instead of the old
// SectionTabs' bottom-border, gradient header background, Lucide icons, Lexend).
//
// Org/workspace switcher and the profile/settings menu are the real, existing
// OrgWorkspaceBreadcrumbs/ProfileSection components, reused as-is for their logic (org/workspace
// API calls + switching, export/import, logout) — only restyled to the new pill/icon-circle look
// via the `variant="accelance"` prop each now supports, not rebuilt.
const AccelanceHeader = () => {
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
    const { groups, activeSection, setActiveSection } = useMenuSections()
    const logoutApi = useApi(accountApi.logout)

    const signOutClicked = () => {
        logoutApi.request()
    }

    useEffect(() => {
        if (logoutApi.data && logoutApi.data.message === 'logged_out') {
            store.dispatch(logoutSuccess())
            window.location.href = logoutApi.data.redirectTo
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [logoutApi.data])

    return (
        <header
            style={{
                flex: '0 0 auto',
                height: 64,
                display: 'flex',
                alignItems: 'center',
                gap: 32,
                padding: '0 24px',
                borderBottom: '1px solid var(--accelance-charcoal-100)',
                background: 'var(--accelance-gradient-skyline-mist-2)',
                fontFamily: 'var(--accelance-font-primary)'
            }}
        >
            <Link to='/' style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 176, textDecoration: 'none' }}>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ display: 'block', width: 18, height: 3, borderRadius: 2, background: 'var(--accelance-green-300)' }} />
                    <span style={{ display: 'block', width: 13, height: 3, borderRadius: 2, background: 'var(--accelance-azure-400)' }} />
                    <span style={{ display: 'block', width: 18, height: 3, borderRadius: 2, background: 'var(--accelance-azure-400)' }} />
                </span>
                <span style={{ fontSize: 21, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--accelance-deepblue-600)' }}>
                    fluid
                </span>
            </Link>

            {isAuthenticated && groups.length > 1 && (
                <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {groups.map((group) => {
                        const Icon = SECTION_TAB_ICONS[group.id]
                        const isActive = group.id === activeSection
                        const tabStyle = {
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            height: 64,
                            padding: '0 14px',
                            boxSizing: 'border-box',
                            borderBottom: isActive ? '2px solid var(--accelance-azure-400)' : '2px solid transparent',
                            color: isActive ? 'var(--accelance-azure-400)' : 'var(--accelance-charcoal-400)',
                            fontSize: 15,
                            fontFamily: 'inherit',
                            fontWeight: isActive ? 500 : 300
                        }

                        // The active tab isn't interactive in the source mockup (cursor: default,
                        // no data-route) — you're already on it. Only inactive tabs are clickable,
                        // as a real <button> so it's keyboard-reachable (jsx-a11y).
                        if (isActive) {
                            return (
                                <span key={group.id} style={{ ...tabStyle, cursor: 'default' }}>
                                    {Icon && <Icon size={17} />}
                                    {group.title}
                                </span>
                            )
                        }

                        return (
                            <button
                                key={group.id}
                                type='button'
                                onClick={() => setActiveSection(group.id)}
                                className='acc-section-tab'
                                style={{
                                    ...tabStyle,
                                    appearance: 'none',
                                    border: 'none',
                                    borderBottom: tabStyle.borderBottom,
                                    background: 'transparent',
                                    cursor: 'pointer'
                                }}
                            >
                                {Icon && <Icon size={17} />}
                                {group.title}
                            </button>
                        )
                    })}
                </nav>
            )}

            <div style={{ flex: 1 }} />

            {isAuthenticated && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <OrgWorkspaceBreadcrumbs variant='accelance' />
                    <ProfileSection variant='accelance' handleLogout={signOutClicked} />
                </div>
            )}
        </header>
    )
}

export default AccelanceHeader
