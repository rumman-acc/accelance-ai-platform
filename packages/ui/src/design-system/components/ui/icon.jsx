import * as React from 'react'
import PropTypes from 'prop-types'
import * as TablerIcons from '@tabler/icons-react'

// Wraps @tabler/icons-react per design-system/components/component-inventory.md (Icon):
// outline style only, 24x24 standard / 16x16 dense, inherits text color by default.
// `name` is a PascalCase Tabler component name without the "Icon" prefix, e.g. name="Rocket" -> IconRocket.
const Icon = React.forwardRef(({ name, size = 24, color = 'currentColor', className, ...props }, ref) => {
    const Component = TablerIcons[`Icon${name}`]
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
