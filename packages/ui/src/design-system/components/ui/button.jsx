import * as React from 'react'
import PropTypes from 'prop-types'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Variants/tokens per design-system/components/component-inventory.md (Button).
// Do not add a fourth variant — see CLAUDE.md hard rule 4 / component-inventory.md "Don't".
const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 rounded font-sans text-button transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                primary: 'bg-primary text-white hover:bg-primary-dark',
                secondary: 'bg-white text-primary border border-primary hover:bg-off-white',
                tertiary: 'bg-transparent text-primary underline-offset-4 hover:underline'
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-8 px-3 text-small',
                lg: 'h-12 px-6'
            }
        },
        defaultVariants: {
            variant: 'primary',
            size: 'default'
        }
    }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
})
Button.displayName = 'Button'

Button.propTypes = {
    className: PropTypes.string,
    variant: PropTypes.oneOf(['primary', 'secondary', 'tertiary']),
    size: PropTypes.oneOf(['default', 'sm', 'lg']),
    asChild: PropTypes.bool
}

export { Button, buttonVariants }
