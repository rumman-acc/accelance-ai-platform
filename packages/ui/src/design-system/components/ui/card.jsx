import * as React from 'react'
import PropTypes from 'prop-types'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Variants per design-system/components/component-inventory.md (Card).
// default: white, 1px border. tinted: light-blue, borderless. elevated: shadow, busy backgrounds only.
const cardVariants = cva('rounded p-3', {
    variants: {
        variant: {
            default: 'bg-white border border-border',
            tinted: 'bg-tint/25',
            elevated: 'bg-white shadow-elevated'
        }
    },
    defaultVariants: {
        variant: 'default'
    }
})

const Card = React.forwardRef(({ className, variant, ...props }, ref) => (
    <div className={cn(cardVariants({ variant, className }))} ref={ref} {...props} />
))
Card.displayName = 'Card'

Card.propTypes = {
    className: PropTypes.string,
    variant: PropTypes.oneOf(['default', 'tinted', 'elevated'])
}

export { Card, cardVariants }
