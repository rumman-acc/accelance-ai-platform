import { menuItems } from '@/menu-items'

// ==============================|| MENU SECTION HELPERS ||==============================
// Shared by the header's section nav and the sidebar, so both agree on which top-level
// groups (menu-items/dashboard.js) exist and which route belongs to which group.

export const getMenuGroups = () => menuItems.items[0].children

export const isMenuItemVisible = (menu, hasPermission, hasDisplay) => {
    if (menu.permission && !hasPermission(menu.permission)) {
        return false
    }
    if (menu.display) {
        return hasDisplay(menu.display)
    }
    return true
}

// Returns only the groups (and, within each, only the children) the current user can see, with
// each group's defaultItemId (menu-items/dashboard.js) sorted to the top of its list — it's the
// item a section tab jumps to, so it should also be the first thing you see for that section.
export const getVisibleMenuGroups = (hasPermission, hasDisplay) =>
    getMenuGroups()
        .map((group) => {
            const children = group.children.filter((child) => isMenuItemVisible(child, hasPermission, hasDisplay))
            const defaultIndex = children.findIndex((child) => child.id === group.defaultItemId)
            if (defaultIndex > 0) {
                const [defaultChild] = children.splice(defaultIndex, 1)
                children.unshift(defaultChild)
            }
            return { ...group, children }
        })
        .filter((group) => group.children.length > 0)

// Which group owns the current route, matched by the first path segment against each
// child item's url (e.g. '/document-stores/abc' -> '/document-stores' -> that item's group).
export const findGroupIdForPath = (groups, pathname) => {
    const pathSegment = pathname.split('/')[1]
    // Root ('/') renders the default landing page directly without changing the URL
    // (routes/DefaultRedirect.jsx) — mirror NavItem's own existing root-path convention
    // (Sidebar/MenuList/NavItem/index.jsx forces 'controlTower' selected at '/') so the section
    // nav doesn't get stuck showing whatever group was last active before a refresh.
    if (!pathSegment) {
        const owningGroup = groups.find((group) => group.children.some((child) => child.id === 'controlTower'))
        return owningGroup?.id ?? null
    }
    const owningGroup = groups.find((group) => group.children.some((child) => child.url?.split('/')[1] === pathSegment))
    return owningGroup?.id ?? null
}

// The page a section's nav tab jumps to when picked (menu-items/dashboard.js `defaultItemId`),
// falling back to the group's first visible item if that item got filtered out by RBAC/flags.
export const getDefaultUrlForGroup = (group) => {
    if (!group) return null
    const defaultChild = group.children.find((child) => child.id === group.defaultItemId) || group.children[0]
    return defaultChild?.url ?? null
}
