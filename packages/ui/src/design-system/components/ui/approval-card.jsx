import * as React from 'react'
import PropTypes from 'prop-types'
import { cn } from '@/lib/utils'
import { Card } from './card'
import { Icon } from './icon'
import { AgentStatus } from './agent-status'
import { Button } from './button'

// Anatomy per design-system/components/component-inventory.md (Agent governance > ApprovalCard):
// agent name, proposed action, detail/context text, approve + reject actions. Every AI-proposed
// action renders as an explicit confirmation card — never a silent auto-execution.
const ApprovalCard = React.forwardRef(
    ({ className, agent, action, detail, tier = 'review', onApprove, onReject, hideActions = false, ...props }, ref) => (
        <Card ref={ref} variant='elevated' className={cn('p-3', className)} {...props}>
            <div className='mb-2 flex items-center justify-between gap-3'>
                <span className='inline-flex items-center gap-2 text-small font-bold text-primary'>
                    <Icon name='Robot' size={18} />
                    {agent}
                </span>
                <AgentStatus tier={tier} />
            </div>
            <div className='mb-1 text-h5 text-body'>{action}</div>
            <div className='mb-2 text-small text-body'>{detail}</div>
            {!hideActions && (
                <div className='flex gap-2'>
                    <Button variant='primary' size='sm' onClick={onApprove}>
                        Approve action
                    </Button>
                    <Button variant='secondary' size='sm' onClick={onReject}>
                        Send back
                    </Button>
                </div>
            )}
        </Card>
    )
)
ApprovalCard.displayName = 'ApprovalCard'

ApprovalCard.propTypes = {
    className: PropTypes.string,
    agent: PropTypes.string.isRequired,
    action: PropTypes.string.isRequired,
    detail: PropTypes.string.isRequired,
    tier: PropTypes.oneOf(['autonomous', 'review', 'approval']),
    onApprove: PropTypes.func,
    onReject: PropTypes.func,
    hideActions: PropTypes.bool
}

export { ApprovalCard }
