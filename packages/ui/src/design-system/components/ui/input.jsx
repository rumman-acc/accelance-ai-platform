import * as React from 'react'
import PropTypes from 'prop-types'
import { cn } from '@/lib/utils'

// Per design-system/components/component-inventory.md (Forms > Input/Field): label above input
// (never placeholder-as-label), optional hint/error text below. Errors shown via border + message,
// never color alone.
const Input = React.forwardRef(({ className, ...props }, ref) => (
    <input
        ref={ref}
        className={cn(
            'w-full rounded border border-border px-2 py-2 font-sans text-body text-[#1F2937] outline-none transition-colors duration-300',
            'focus:border-primary focus:ring-2 focus:ring-primary/15',
            className
        )}
        {...props}
    />
))
Input.displayName = 'Input'

const Field = React.forwardRef(({ className, label, hint, error, htmlFor, children }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-2', className)}>
        {label && (
            <label htmlFor={htmlFor} className='text-label font-bold text-[#1F2937]'>
                {label}
            </label>
        )}
        {children}
        {error ? (
            <span className='text-small text-alert'>{error}</span>
        ) : hint ? (
            <span className='text-small text-muted'>{hint}</span>
        ) : null}
    </div>
))
Field.displayName = 'Field'

Input.propTypes = {
    className: PropTypes.string
}

Field.propTypes = {
    className: PropTypes.string,
    label: PropTypes.string,
    hint: PropTypes.string,
    error: PropTypes.string,
    htmlFor: PropTypes.string,
    children: PropTypes.node
}

export { Input, Field }
