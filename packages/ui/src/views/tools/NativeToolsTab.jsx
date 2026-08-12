import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'

// material-ui
import { Box, CircularProgress, Stack } from '@mui/material'

// project imports
import NativeToolCard from '@/ui-component/cards/NativeToolCard'
import TablePagination, { DEFAULT_ITEMS_PER_PAGE } from '@/ui-component/pagination/TablePagination'
import { gridSpacing, NATIVE_TOOL_CONFIG_STATUS } from '@/store/constant'

// icons
import ToolEmptySVG from '@/assets/images/tools_empty.svg'

// ==============================|| NATIVE TOOLS TAB (presentational) ||============================== //
// Renders one of the three Native catalog buckets (Tools / Connectors / MCP Servers).
// Data is fetched once by useNativeToolsCatalog and passed down, so switching between
// the three Native tabs doesn't re-fetch. Paginated client-side since the native catalog
// (tens of nodes today) is fetched in full; if this ever backs an aggregator-scale source
// (hundreds/thousands of tools), this needs to become server-paginated instead of sliced here.

const NativeToolsTab = ({ items, isLoading, search, emptyLabel }) => {
    const navigate = useNavigate()
    const [currentPage, setCurrentPage] = useState(1)
    const [pageLimit, setPageLimit] = useState(DEFAULT_ITEMS_PER_PAGE)

    const filteredItems = useMemo(() => {
        const q = (search || '').toLowerCase()
        if (!q) return items
        return items.filter((item) => item.label.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q))
    }, [items, search])

    // Reset to page 1 whenever the underlying set changes (search term, tab switch) so a
    // narrower filter never leaves the view stranded on an out-of-range empty page.
    useEffect(() => {
        setCurrentPage(1)
    }, [filteredItems])

    const pagedItems = useMemo(() => {
        const start = (currentPage - 1) * pageLimit
        return filteredItems.slice(start, start + pageLimit)
    }, [filteredItems, currentPage, pageLimit])

    const onPageChange = (page, limit) => {
        setCurrentPage(page)
        setPageLimit(limit)
    }

    const onCardClick = (item) => {
        if (item.configStatus === NATIVE_TOOL_CONFIG_STATUS.SETUP_REQUIRED) {
            navigate('/credentials')
        }
    }

    if (isLoading) {
        return (
            <Box display='flex' alignItems='center' justifyContent='center' sx={{ py: 10 }}>
                <CircularProgress />
            </Box>
        )
    }

    if (filteredItems.length === 0) {
        return (
            <Stack sx={{ alignItems: 'center', justifyContent: 'center' }} flexDirection='column'>
                <Box sx={{ p: 2, height: 'auto' }}>
                    <img style={{ objectFit: 'cover', height: '20vh', width: 'auto' }} src={ToolEmptySVG} alt='ToolEmptySVG' />
                </Box>
                <div>{emptyLabel}</div>
            </Stack>
        )
    }

    return (
        <>
            <Box display='grid' gridTemplateColumns='repeat(3, 1fr)' gap={gridSpacing}>
                {pagedItems.map((item) => (
                    <NativeToolCard key={item.name} data={item} onClick={() => onCardClick(item)} />
                ))}
            </Box>
            <TablePagination currentPage={currentPage} limit={pageLimit} total={filteredItems.length} onChange={onPageChange} />
        </>
    )
}

NativeToolsTab.propTypes = {
    items: PropTypes.array.isRequired,
    isLoading: PropTypes.bool,
    search: PropTypes.string,
    emptyLabel: PropTypes.string
}

export default NativeToolsTab
