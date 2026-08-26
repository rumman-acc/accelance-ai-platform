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
            <Link to='/' style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 176, textDecoration: 'none' }}>
                <svg width='30' height='30' viewBox='0 0 200 200' fill='none' aria-hidden='true'>
                    <defs>
                        <radialGradient id='fluid-mark-core' cx='38%' cy='30%' r='62%'>
                            <stop offset='0%' stopColor='#5AAEF0' />
                            <stop offset='40%' stopColor='#0F74BD' />
                            <stop offset='100%' stopColor='#062667' />
                        </radialGradient>
                        <radialGradient id='fluid-mark-tr' cx='36%' cy='28%' r='62%'>
                            <stop offset='0%' stopColor='#7DEAB2' />
                            <stop offset='40%' stopColor='#13BA2F' />
                            <stop offset='100%' stopColor='#0A7A1F' />
                        </radialGradient>
                    </defs>
                    <path d='M82 82 C72 66 62 56 52 48 C58 44 64 44 70 50 C76 56 82 66 84 78Z' fill='#0F74BD' opacity='0.4' />
                    <path d='M106 80 C116 64 130 54 148 46 C150 52 148 58 140 63 C132 68 118 76 108 84Z' fill='#13BA2F' opacity='0.35' />
                    <path d='M80 106 C66 116 52 126 36 138 C34 132 36 126 42 122 C48 118 66 110 82 104Z' fill='#0F74BD' opacity='0.3' />
                    <circle cx='40' cy='36' r='22' fill='#0F74BD' />
                    <ellipse cx='31' cy='26' rx='7' ry='4.5' fill='#FFFFFF' opacity='0.4' transform='rotate(-25,31,26)' />
                    <circle cx='160' cy='36' r='26' fill='url(#fluid-mark-tr)' />
                    <ellipse cx='150' cy='25' rx='8' ry='5' fill='#FFFFFF' opacity='0.4' transform='rotate(-25,150,25)' />
                    <circle cx='96' cy='96' r='38' fill='url(#fluid-mark-core)' />
                    <ellipse cx='81' cy='80' rx='12' ry='7' fill='#FFFFFF' opacity='0.35' transform='rotate(-25,81,80)' />
                    <circle cx='26' cy='158' r='20' fill='#0F74BD' opacity='0.8' />
                </svg>
                <span style={{ fontSize: 25, fontWeight: 300, letterSpacing: '-0.02em', color: 'var(--accelance-deepblue-600)' }}>
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
