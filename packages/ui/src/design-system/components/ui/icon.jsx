import * as React from 'react'
import PropTypes from 'prop-types'
import {
    IconActivityHeartbeat,
    IconBooks,
    IconBroadcast,
    IconBuildingCommunity,
    IconChecklist,
    IconCircleCheck,
    IconClockBolt,
    IconCpu,
    IconHandStop,
    IconLink,
    IconPlugConnected,
    IconRobot,
    IconSitemap,
    IconUserSearch
} from '@tabler/icons-react'

// Wraps @tabler/icons-react per design-system/components/component-inventory.md (Icon):
// outline style only, 24x24 standard / 16x16 dense, inherits text color by default.
// `name` is a PascalCase Tabler component name without the "Icon" prefix, e.g. name="Rocket" -> IconRocket.
//
// Named imports + an explicit registry, NOT `import * as TablerIcons` — a namespace import of this
// package pulls in every one of its ~5,900 icons (4.4MB in the production bundle) because Rollup
// can't tree-shake a dynamically-indexed namespace object. Add new icons here as they're needed by
// a consumer of this component — never widen this back to a wildcard import.
const registry = {
    ActivityHeartbeat: IconActivityHeartbeat,
    Books: IconBooks,
    Broadcast: IconBroadcast,
    BuildingCommunity: IconBuildingCommunity,
    Checklist: IconChecklist,
    CircleCheck: IconCircleCheck,
    ClockBolt: IconClockBolt,
    Cpu: IconCpu,
    HandStop: IconHandStop,
    Link: IconLink,
    PlugConnected: IconPlugConnected,
    Robot: IconRobot,
    Sitemap: IconSitemap,
    UserSearch: IconUserSearch
}

const Icon = React.forwardRef(({ name, size = 24, color = 'currentColor', className, ...props }, ref) => {
    const Component = registry[name]
    if (!Component) return null
    return <Component ref={ref} size={size} color={color} className={className} {...props} />
})
Icon.displayName = 'Icon'

Icon.propTypes = {
    name: PropTypes.string.isRequired,
    size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    color: PropTypes.string,
    className: PropTypes.string
}

export { Icon }
