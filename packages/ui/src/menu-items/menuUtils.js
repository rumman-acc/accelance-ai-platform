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

// Returns only the groups (and, within each, only the children) the current user can see.
export const getVisibleMenuGroups = (hasPermission, hasDisplay) =>
    getMenuGroups()
        .map((group) => ({
            ...group,
            children: group.children.filter((child) => isMenuItemVisible(child, hasPermission, hasDisplay))
        }))
        .filter((group) => group.children.length > 0)

// Which group owns the current route, matched by the first path segment against each
// child item's url (e.g. '/document-stores/abc' -> '/document-stores' -> that item's group).
export const findGroupIdForPath = (groups, pathname) => {
    const pathSegment = pathname.split('/')[1]
    if (!pathSegment) return null
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
