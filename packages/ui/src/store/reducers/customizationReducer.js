// project imports
import config from '@/config'

// action - state management
import * as actionTypes from '../actions'

export const initialState = {
    isOpen: [], // for active default menu
    fontFamily: config.fontFamily,
    borderRadius: config.borderRadius,
    opened: true,
    isHorizontal: localStorage.getItem('isHorizontal') === 'true' ? true : false,
    // Light-only for now: the accelance design system (design-system/tokens.json) has no dark
    // palette. Toggle removed from Header (migration-checklist.md row 1) — forcing false here too so
    // a stale `isDarkMode=true` in an existing user's localStorage can't strand them in dark mode with
    // no way back. See DESIGN_SPEC.md Section 9 — logged as open, not silently dropped.
    isDarkMode: false,
    // Which top-level menu group (menu-items/dashboard.js) the sidebar currently shows — driven by
    // the header's section nav. Persisted so a refresh doesn't drop the user back to "Build";
    // overridden on route change by useMenuSections' route->section sync.
    activeMenuSection: localStorage.getItem('activeMenuSection') || 'primary'
}

// ==============================|| CUSTOMIZATION REDUCER ||============================== //

const customizationReducer = (state = initialState, action) => {
    let id
    switch (action.type) {
        case actionTypes.MENU_OPEN:
            id = action.id
            return {
                ...state,
                isOpen: [id]
            }
        case actionTypes.SET_MENU:
            return {
                ...state,
                opened: action.opened
            }
        case actionTypes.SET_FONT_FAMILY:
            return {
                ...state,
                fontFamily: action.fontFamily
            }
        case actionTypes.SET_BORDER_RADIUS:
            return {
                ...state,
                borderRadius: action.borderRadius
            }
        case actionTypes.SET_LAYOUT:
            return {
                ...state,
                isHorizontal: action.isHorizontal
            }
        case actionTypes.SET_DARKMODE:
            return {
                ...state,
                isDarkMode: action.isDarkMode
            }
        case actionTypes.SET_ACTIVE_MENU_SECTION:
            localStorage.setItem('activeMenuSection', action.activeMenuSection)
            return {
                ...state,
                activeMenuSection: action.activeMenuSection
            }
        default:
            return state
    }
}

export default customizationReducer
