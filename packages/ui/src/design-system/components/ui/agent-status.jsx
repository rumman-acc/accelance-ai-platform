import * as React from 'react'
import PropTypes from 'prop-types'
import { cn } from '@/lib/utils'
import { Icon } from './icon'

// Three-tier agent governance system per design-system/components/component-inventory.md
// (Agent governance) and tokens.json `color.agentStatus` — not optional styling, ties directly
// to the product's human-in-the-loop governance positioning. Tone must stay consistent everywhere.
const tiers = {
    autonomous: { className: 'bg-agent-autonomous/10 text-agent-autonomous', icon: 'CircleCheck', label: 'Autonomous' },
    review: { className: 'bg-agent-review/10 text-agent-review', icon: 'UserSearch', label: 'Human review required' },
    approval: { className: 'bg-agent-approval/10 text-agent-approval', icon: 'HandStop', label: 'Mandatory approval' }
}

const AgentStatus = React.forwardRef(({ className, tier = 'autonomous', label, ...props }, ref) => {
    const t = tiers[tier] || tiers.autonomous
    return (
        <span
            ref={ref}
            className={cn('inline-flex items-center gap-2 rounded-full px-2 py-1 text-label font-bold', t.className, className)}
            {...props}
        >
            <Icon name={t.icon} size={16} />
            {label || t.label}
        </span>
    )
})
AgentStatus.displayName = 'AgentStatus'

AgentStatus.propTypes = {
    className: PropTypes.string,
    tier: PropTypes.oneOf(['autonomous', 'review', 'approval']),
    label: PropTypes.string
}

export { AgentStatus, tiers as agentStatusTiers }
