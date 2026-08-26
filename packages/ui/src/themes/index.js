import { createTheme } from '@mui/material/styles'

// assets
import colors from '@/assets/scss/_themes-vars.module.scss'

// project imports
import componentStyleOverrides from './compStyleOverride'
import themePalette from './palette'
import themeTypography from './typography'

/**
 * Represent theme style and structure as per Material-UI
 * @param {JsonObject} customization customization parameter object
 */

export const theme = (customization) => {
    const color = colors

    const themeOption = customization.isDarkMode
        ? {
              colors: color,
              heading: color.paper,
              paper: color.darkPrimaryLight,
              backgroundDefault: color.darkPaper,
              background: color.darkPrimaryLight,
              darkTextPrimary: color.paper,
              darkTextSecondary: color.paper,
              textDark: color.paper,
              menuSelected: color.darkSecondaryDark,
              menuSelectedBack: color.darkSecondaryLight,
              divider: color.darkPaper,
              customization
          }
        : {
              colors: color,
              heading: color.grey900,
              paper: color.paper,
              backgroundDefault: color.paper,
              background: color.primaryLight,
              darkTextPrimary: color.grey700,
              darkTextSecondary: color.grey500,
              textDark: color.grey900,
              // Sidebar hover/active nav item — brand primary blue, not secondary (secondary is the
              // Fluid green ramp, which reads as an unrelated status color on nav items, not a brand accent).
              menuSelected: color.primaryDark,
              menuSelectedBack: color.primaryLight,
              divider: color.grey200,
              customization
          }

    const themeOptions = {
        direction: 'ltr',
        palette: themePalette(themeOption),
        // design-system/tokens.json radius token (8px universal) — was unset, so MUI's default (4)
        // silently disagreed with the brand radius everywhere a numeric `sx={{ borderRadius: N }}`
        // shorthand was used. Now derives from the same customization value as everything else.
        shape: {
            borderRadius: customization.borderRadius
        },
        mixins: {
            toolbar: {
                minHeight: '48px',
                padding: '16px',
                '@media (min-width: 600px)': {
                    minHeight: '48px'
                }
            }
        },
        typography: themeTypography(themeOption)
    }

    const themes = createTheme(themeOptions)
    themes.components = componentStyleOverrides(themeOption)

    return themes
}

export default theme
