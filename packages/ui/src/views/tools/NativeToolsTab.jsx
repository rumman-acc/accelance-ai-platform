import { useMemo } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'

// material-ui
import { Box, CircularProgress, Stack } from '@mui/material'

// project imports
import NativeToolCard from '@/ui-component/cards/NativeToolCard'
import { gridSpacing, NATIVE_TOOL_CONFIG_STATUS } from '@/store/constant'

// icons
import ToolEmptySVG from '@/assets/images/tools_empty.svg'

// ==============================|| NATIVE TOOLS TAB (presentational) ||============================== //
// Renders one of the three Native catalog buckets (Tools / Connectors / MCP Servers).
// Data is fetched once by useNativeToolsCatalog and passed down, so switching between
// the three Native tabs doesn't re-fetch.

const NativeToolsTab = ({ items, isLoading, search, emptyLabel }) => {
    const navigate = useNavigate()

    const filteredItems = useMemo(() => {
        const q = (search || '').toLowerCase()
        if (!q) return items
        return items.filter((item) => item.label.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q))
    }, [items, search])

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
        <Box display='grid' gridTemplateColumns='repeat(3, 1fr)' gap={gridSpacing}>
            {filteredItems.map((item) => (
                <NativeToolCard key={item.name} data={item} onClick={() => onCardClick(item)} />
            ))}
        </Box>
    )
}

NativeToolsTab.propTypes = {
    items: PropTypes.array.isRequired,
    isLoading: PropTypes.bool,
    search: PropTypes.string,
    emptyLabel: PropTypes.string
}

export default NativeToolsTab
