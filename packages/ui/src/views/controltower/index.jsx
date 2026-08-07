import { useEffect, useState } from 'react'
import { omit } from 'lodash'

// material-ui
import { Box, Grid, Paper, Stack, Tab, Tabs, Typography, useTheme } from '@mui/material'
import { IconAlertTriangle, IconHeartbeat, IconHourglass, IconPlayerPlay, IconRobot } from '@tabler/icons-react'

// project imports
import ErrorBoundary from '@/ErrorBoundary'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import MainCard from '@/ui-component/cards/MainCard'
import TablePagination, { DEFAULT_ITEMS_PER_PAGE } from '@/ui-component/pagination/TablePagination'
import { ExecutionsListTable } from '@/ui-component/table/ExecutionsListTable'
import { ExecutionDetails } from '@/views/agentexecutions/ExecutionDetails'

// API
import controlTowerApi from '@/api/control-tower'
import executionsApi from '@/api/executions'
import useApi from '@/hooks/useApi'

// assets
import execution_empty from '@/assets/images/executions_empty.svg'

// ==============================|| CONTROL TOWER ||============================== //

const STAT_TILES = [
    { key: 'totalAgents', label: 'Agents Built', icon: IconRobot, color: '#7c4dff' },
    { key: 'healthy', label: 'Healthy', icon: IconHeartbeat, color: '#2e7d32' },
    { key: 'runningNow', label: 'Running Now', icon: IconPlayerPlay, color: '#1565c0' },
    { key: 'awaitingApproval', label: 'Awaiting Approval', icon: IconHourglass, color: '#ed6c02' },
    { key: 'needsAttention', label: 'Needs Attention', icon: IconAlertTriangle, color: '#c62828' }
]

// Each tab is just a fixed execution-state filter over the same /executions endpoint
// the general Executions page already exposes — Control Tower is a curated front
// door onto that data, not a new data source.
const TABS = [
    { label: 'Running Now', state: 'INPROGRESS', emptyText: 'Nothing running right now' },
    { label: 'Needs Approval', state: 'STOPPED', emptyText: 'No approvals waiting' }
]

const parseExecutionData = (execution) =>
    typeof execution.executionData === 'string' ? JSON.parse(execution.executionData) : execution.executionData

const ControlTower = () => {
    const theme = useTheme()
    const borderColor = theme.palette.divider

    const getStatsApi = useApi(controlTowerApi.getStats)
    const getAllExecutions = useApi(executionsApi.getAllExecutions)
    const getExecutionByIdApi = useApi(executionsApi.getExecutionById)

    const [error, setError] = useState(null)
    const [isLoading, setLoading] = useState(true)
    const [stats, setStats] = useState(null)
    const [activeTab, setActiveTab] = useState(0)

    const [executions, setExecutions] = useState([])
    const [total, setTotal] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageLimit, setPageLimit] = useState(DEFAULT_ITEMS_PER_PAGE)

    const [openDrawer, setOpenDrawer] = useState(false)
    const [selectedExecutionData, setSelectedExecutionData] = useState([])
    const [selectedMetadata, setSelectedMetadata] = useState({})

    const fetchTab = (tabIndex, page, limit) => {
        getAllExecutions.request({ state: TABS[tabIndex].state, page, limit })
    }

    const refreshAll = () => {
        getStatsApi.request()
        fetchTab(activeTab, currentPage, pageLimit)
    }

    useEffect(() => {
        getStatsApi.request()
        fetchTab(0, 1, DEFAULT_ITEMS_PER_PAGE)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getStatsApi.data) setStats(getStatsApi.data)
    }, [getStatsApi.data])

    useEffect(() => {
        if (getAllExecutions.data) {
            const { data, total: totalCount } = getAllExecutions.data
            if (Array.isArray(data)) {
                setExecutions(data)
                setTotal(totalCount)
            }
        }
    }, [getAllExecutions.data])

    useEffect(() => {
        setLoading(getAllExecutions.loading)
    }, [getAllExecutions.loading])

    useEffect(() => {
        setError(getAllExecutions.error || getStatsApi.error)
    }, [getAllExecutions.error, getStatsApi.error])

    useEffect(() => {
        if (getExecutionByIdApi.data) {
            const execution = getExecutionByIdApi.data
            setSelectedExecutionData(parseExecutionData(execution))
            setSelectedMetadata(omit(execution, ['executionData']))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getExecutionByIdApi.data])

    const handleTabChange = (_, newValue) => {
        setActiveTab(newValue)
        setCurrentPage(1)
        fetchTab(newValue, 1, pageLimit)
    }

    const handlePageChange = (page, limit) => {
        setCurrentPage(page)
        setPageLimit(limit)
        fetchTab(activeTab, page, limit)
    }

    return (
        <MainCard>
            {error ? (
                <ErrorBoundary error={error} />
            ) : (
                <Stack flexDirection='column' sx={{ gap: 3 }}>
                    <ViewHeader title='Control Tower' description='Live health and pending approvals across every agent' />

                    <Grid container spacing={2}>
                        {STAT_TILES.map((tile) => {
                            const Icon = tile.icon
                            return (
                                <Grid item xs={12} sm={6} md={2.4} key={tile.key}>
                                    <Paper variant='outlined' sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderColor }}>
                                        <Icon size={28} color={tile.color} style={{ flexShrink: 0 }} />
                                        <Box>
                                            <Typography variant='h4'>{stats ? stats[tile.key] ?? 0 : '—'}</Typography>
                                            <Typography variant='caption' color='textSecondary'>
                                                {tile.label}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Grid>
                            )
                        })}
                    </Grid>

                    <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor }}>
                        {TABS.map((tab) => (
                            <Tab key={tab.label} label={tab.label} />
                        ))}
                    </Tabs>

                    {isLoading || executions?.length > 0 ? (
                        <>
                            <ExecutionsListTable
                                data={executions}
                                isLoading={isLoading}
                                onExecutionRowClick={(execution) => {
                                    setOpenDrawer(true)
                                    setSelectedExecutionData(parseExecutionData(execution))
                                    setSelectedMetadata(omit(execution, ['executionData']))
                                }}
                            />

                            {!isLoading && total > 0 && (
                                <TablePagination currentPage={currentPage} limit={pageLimit} total={total} onChange={handlePageChange} />
                            )}

                            <ExecutionDetails
                                open={openDrawer}
                                execution={selectedExecutionData}
                                metadata={selectedMetadata}
                                onClose={() => setOpenDrawer(false)}
                                onProceedSuccess={() => {
                                    setOpenDrawer(false)
                                    refreshAll()
                                }}
                                onUpdateSharing={refreshAll}
                                onRefresh={(executionId) => {
                                    refreshAll()
                                    getExecutionByIdApi.request(executionId)
                                }}
                            />
                        </>
                    ) : (
                        !isLoading && (
                            <Stack sx={{ alignItems: 'center', justifyContent: 'center' }} flexDirection='column'>
                                <Box sx={{ p: 2, height: 'auto' }}>
                                    <img
                                        style={{ objectFit: 'cover', height: '20vh', width: 'auto' }}
                                        src={execution_empty}
                                        alt='execution_empty'
                                    />
                                </Box>
                                <div>{TABS[activeTab].emptyText}</div>
                            </Stack>
                        )
                    )}
                </Stack>
            )}
        </MainCard>
    )
}

export default ControlTower
