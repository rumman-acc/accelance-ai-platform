import * as React from 'react'
import PropTypes from 'prop-types'
import { cn } from '@/lib/utils'
import { Icon } from './icon'

// Anatomy per design-system/components/component-inventory.md (Data > Table): blue header row,
// white bold header text, alternating row shading, horizontal borders only (no vertical), tint
// on row hover. `rows` cells may be any node (e.g. an <AgentStatus/>), not just strings — matches
// the source spec's own usage in ui_kits/agent-console.
//
// Props beyond the source spec (additive, not a redesign of it):
// - `columns` entries may be a plain string (non-sortable) or `{ label, key }` (sortable, paired
//   with `sortBy`/`sortDirection`/`onSort`) — the component only renders the indicator and reports
//   clicks; the caller still owns actually sorting `rows`, same split as onRowClick below.
// - `onRowClick`/`getRowKey` — needed for list pages with row-click-to-open-detail.
// - `maxHeightClassName` — bounds the table to a scrollable region with a sticky header, so a long
//   list scrolls in place instead of growing the whole page (e.g. Control Tower, migration-
//   checklist.md row 24 follow-up) — omit it and the table lays out inline as before.
const Table = React.forwardRef(function Table(
    {
        className,
        columns = [],
        rows = [],
        onRowClick,
        getRowKey,
        striped = true,
        sortBy,
        sortDirection = 'asc',
        onSort,
        maxHeightClassName,
        ...props
    },
    ref
) {
    const table = (
        <table ref={ref} className={cn('w-full table-auto border-collapse text-small', className)} {...props}>
            <thead>
                <tr>
                    {columns.map((column, index) => {
                        const isSortConfig = typeof column === 'object' && column !== null
                        const label = isSortConfig ? column.label : column
                        const sortKey = isSortConfig ? column.key : undefined
                        const isSortable = Boolean(sortKey && onSort)
                        const isActive = isSortable && sortBy === sortKey
                        return (
                            <th
                                key={index}
                                onClick={isSortable ? () => onSort(sortKey) : undefined}
                                className={cn(
                                    'sticky top-0 bg-primary px-3 py-2 text-left text-label font-bold text-white',
                                    isSortable && 'cursor-pointer select-none'
                                )}
                            >
                                <span className='inline-flex items-center gap-1'>
                                    {label}
                                    {isSortable && (
                                        <Icon
                                            name={isActive && sortDirection === 'desc' ? 'ChevronDown' : 'ChevronUp'}
                                            size={14}
                                            className={isActive ? 'opacity-100' : 'opacity-40'}
                                        />
                                    )}
                                </span>
                            </th>
                        )
                    })}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, rowIndex) => (
                    <tr
                        key={getRowKey ? getRowKey(row, rowIndex) : rowIndex}
                        onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                        className={cn(
                            'border-t border-border',
                            striped && rowIndex % 2 === 1 ? 'bg-off-white' : 'bg-white',
                            onRowClick && 'cursor-pointer hover:bg-tint/40'
                        )}
                    >
                        {(Array.isArray(row) ? row : row.cells).map((cell, cellIndex) => (
                            <td key={cellIndex} className='px-3 py-2 text-body'>
                                {cell}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    )

    return (
        // Corner-clipping (overflow-hidden) has to live on a container that never scrolls — the
        // blue header's square <th> corners were poking past this div's rounded border because
        // nothing clipped them. Scrolling (when maxHeightClassName is set) lives on a nested inner
        // div instead, so the sticky header still sticks to ITS nearest scrolling ancestor and the
        // outer corners stay clipped either way.
        <div className='overflow-hidden rounded border border-border'>
            {maxHeightClassName ? <div className={cn('overflow-y-auto', maxHeightClassName)}>{table}</div> : table}
        </div>
    )
})
Table.displayName = 'Table'

Table.propTypes = {
    className: PropTypes.string,
    columns: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.node, PropTypes.shape({ label: PropTypes.node, key: PropTypes.string })]))
        .isRequired,
    rows: PropTypes.array,
    onRowClick: PropTypes.func,
    getRowKey: PropTypes.func,
    striped: PropTypes.bool,
    sortBy: PropTypes.string,
    sortDirection: PropTypes.oneOf(['asc', 'desc']),
    onSort: PropTypes.func,
    maxHeightClassName: PropTypes.string
}

export { Table }
