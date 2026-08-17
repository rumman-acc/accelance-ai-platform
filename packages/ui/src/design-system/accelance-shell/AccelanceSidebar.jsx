import { Link, useLocation } from 'react-router-dom'

// project imports
import config from '@/config'
import { useMenuSections } from '@/hooks/useMenuSections'
import { useAuth } from '@/hooks/useAuth'
import { MENU_ITEM_ICONS } from './icons'
import './shell.css'

// ==============================|| ACCELANCE SIDEBAR ||==============================
// Matches ControlTower.dc.html's <aside> — pulled via DesignSync 2026-08-14, at the user's
// explicit direction to use this design for the whole app shell. Reuses the section-nav/sidebar
// filtering logic already built (useMenuSections, migration-checklist.md row 23) — only the
// presentation changed: rounded azure-tinted pill for the active item (radius-button, 12px)
// instead of the old left-bar+tint, Lucide icons instead of Tabler (see icons.js), Lexend.
const AccelanceSidebar = () => {
    const location = useLocation()
    const { activeGroup } = useMenuSections()
    const { hasPermission } = useAuth()

    if (!activeGroup) return null

    return (
        <aside
            style={{
                flex: '0 0 248px',
                boxSizing: 'border-box',
                padding: '16px 12px',
                borderRight: '1px solid var(--accelance-charcoal-100)',
                background: 'var(--accelance-white)',
                overflowY: 'auto'
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {activeGroup.children.map((item) => {
                    if (item.permission && !hasPermission(item.permission)) return null
                    const Icon = MENU_ITEM_ICONS[item.id]
                    const urlSegment = item.url?.split('/')[1]
                    const isActive = Boolean(urlSegment) && location.pathname.split('/')[1] === urlSegment

                    const itemStyle = {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        height: 44,
                        padding: '0 14px',
                        borderRadius: 'var(--accelance-radius-button)',
                        fontSize: 15,
                        fontFamily: 'var(--accelance-font-primary)',
                        background: isActive ? 'var(--accelance-azure-50)' : 'transparent',
                        color: isActive ? 'var(--accelance-azure-400)' : 'var(--accelance-charcoal-500)',
                        fontWeight: isActive ? 500 : 300
                    }

                    // The active item isn't a link in the source mockup (cursor: default) — you're
                    // already there, so it's non-interactive, same as a disabled nav state.
                    if (isActive) {
                        return (
                            <span key={item.id} style={{ ...itemStyle, cursor: 'default' }}>
                                {Icon && <Icon size={18} />}
                                {item.title}
                            </span>
                        )
                    }

                    return (
                        <Link
                            key={item.id}
                            to={`${config.basename}${item.url}`}
                            className='acc-nav-item'
                            style={{ ...itemStyle, cursor: 'pointer' }}
                        >
                            {Icon && <Icon size={18} />}
                            {item.title}
                        </Link>
                    )
                })}
            </div>
        </aside>
    )
}

export default AccelanceSidebar
