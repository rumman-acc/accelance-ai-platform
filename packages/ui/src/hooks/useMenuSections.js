import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'

// project imports
import { useAuth } from '@/hooks/useAuth'
import { SET_ACTIVE_MENU_SECTION } from '@/store/actions'
import { getVisibleMenuGroups, findGroupIdForPath, getDefaultUrlForGroup } from '@/menu-items/menuUtils'

// ==============================|| MENU SECTIONS ||==============================
// Single source of truth for "which sidebar group is active", shared by the header's
// section nav (SectionNav) and the sidebar's menu list (MenuList) so they never disagree.
export const useMenuSections = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const { hasPermission, hasDisplay } = useAuth()
    const activeMenuSection = useSelector((state) => state.customization.activeMenuSection)

    const groups = getVisibleMenuGroups(hasPermission, hasDisplay)

    // Keep the active section in sync with direct navigation/deep links (e.g. a bookmark into
    // /roles should switch the section nav + sidebar to "User & Workspace Management"), without
    // fighting a manual section click that hasn't navigated anywhere yet.
    useEffect(() => {
        const matchedId = findGroupIdForPath(groups, location.pathname)
        if (matchedId && matchedId !== activeMenuSection) {
            dispatch({ type: SET_ACTIVE_MENU_SECTION, activeMenuSection: matchedId })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname])

    const activeGroup = groups.find((group) => group.id === activeMenuSection) || groups[0]

    // Picking a section from the nav jumps straight to its default item (e.g. Build -> Control
    // Tower, User & Workspace Management -> Users) rather than just filtering the sidebar in place.
    const setActiveSection = (id) => {
        dispatch({ type: SET_ACTIVE_MENU_SECTION, activeMenuSection: id })
        const defaultUrl = getDefaultUrlForGroup(groups.find((group) => group.id === id))
        if (defaultUrl) {
            navigate(defaultUrl)
        }
    }

    return { groups, activeGroup, activeSection: activeGroup?.id, setActiveSection }
}
