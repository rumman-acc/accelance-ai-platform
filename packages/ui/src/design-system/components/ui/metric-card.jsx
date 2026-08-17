import * as React from 'react'
import PropTypes from 'prop-types'
import { cn } from '@/lib/utils'
import { Icon } from './icon'

// Anatomy per design-system/components/component-inventory.md (Data > MetricCard):
// big number (48px bold), label, optional icon. tone="success" for positive results.
// Icon is housed in a tinted circle per guidelines/iconography.html ("optionally housed in a
// colored circle or flat colored tile") rather than a bare glyph, for more visual presence.
const toneClassNames = {
    primary: { text: 'text-primary', circle: 'bg-primary/10 text-primary' },
    success: { text: 'text-success', circle: 'bg-success/10 text-success' },
    alert: { text: 'text-alert', circle: 'bg-alert/10 text-alert' },
    compliance: { text: 'text-compliance', circle: 'bg-compliance/10 text-compliance' }
}

// `size="sm"` is additive to the source spec — the spec's own example is 3 cards per row; a
// denser 5-across row (Control Tower) needs a smaller number/icon to avoid the tiles dominating
// the page, not the source spec's full 48px treatment.
const sizeClassNames = {
    lg: { gap: 'gap-1.5', padding: 'p-3', circle: 'h-10 w-10', iconSize: 20, value: 'text-h1' },
    sm: { gap: 'gap-1', padding: 'p-2', circle: 'h-8 w-8', iconSize: 16, value: 'text-h2' }
}

const MetricCard = React.forwardRef(({ className, value, label, icon, tone = 'primary', size = 'lg', ...props }, ref) => {
    const toneClasses = toneClassNames[tone] || toneClassNames.primary
    const sizeClasses = sizeClassNames[size] || sizeClassNames.lg
    return (
        <div ref={ref} className={cn('flex flex-col rounded bg-white', sizeClasses.gap, sizeClasses.padding, className)} {...props}>
            {icon && (
                <div className={cn('flex items-center justify-center rounded-full', sizeClasses.circle, toneClasses.circle)}>
                    <Icon name={icon} size={sizeClasses.iconSize} />
                </div>
            )}
            <span className={cn(sizeClasses.value, toneClasses.text)}>{value}</span>
            <span className='text-small text-body'>{label}</span>
        </div>
    )
})
MetricCard.displayName = 'MetricCard'

MetricCard.propTypes = {
    className: PropTypes.string,
    value: PropTypes.node.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.string,
    tone: PropTypes.oneOf(['primary', 'success', 'alert', 'compliance']),
    size: PropTypes.oneOf(['lg', 'sm'])
}

export { MetricCard }
