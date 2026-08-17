import { useEffect, useState } from 'react'
import { omit } from 'lodash'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import { Activity, Bot, ChevronDown, ChevronUp, Hourglass, Loader2, Play, RefreshCw, Search, TriangleAlert } from 'lucide-react'

// project imports
import ErrorBoundary from '@/ErrorBoundary'
import TablePagination, { DEFAULT_ITEMS_PER_PAGE } from '@/ui-component/pagination/TablePagination'
import { ExecutionDetails } from '@/views/agentexecutions/ExecutionDetails'
import '@/design-system/accelance-shell/shell.css'

// API
import controlTowerApi from '@/api/control-tower'
import executionsApi from '@/api/executions'
import useApi from '@/hooks/useApi'

// assets
import execution_empty from '@/assets/images/executions_empty.svg'

// ==============================|| CONTROL TOWER ||============================== //
// Rebuilt against ControlTower.dc.html (pulled via DesignSync 2026-08-14), the user's own
// hand-designed mockup for this exact page — supersedes the prior Tailwind/shadcn rebuild
// (migration-checklist.md row 24), which was a generic composition from the older design system
// rather than a real mockup for this page. Data/handlers below are unchanged; only the
// presentation layer changed (again) — see DESIGN_SPEC.md Section 9 for the full note, including
// the two deliberate deviations from the mockup: no checkbox/select-all column (nothing in the
// real app performs a bulk action on executions, so it would be decorative with no function
// behind it) and the real ExecutionDetails drawer is kept instead of the mockup's own drawer,
// which shows a "run trace" step timeline not backed by any real data model.
const STAT_TILES = [
    { key: 'totalAgents', label: 'Agent swarms built', icon: Bot, tone: 'deepblue', filterStatus: null },
    { key: 'healthy', label: 'Healthy', icon: Activity, tone: 'green', filterStatus: 'healthy' },
    { key: 'runningNow', label: 'Running now', icon: Play, tone: 'azure', filterStatus: 'runningNow' },
    { key: 'awaitingApproval', label: 'Awaiting approval', icon: Hourglass, tone: 'amber', filterStatus: undefined },
    { key: 'needsAttention', label: 'Needs attention', icon: TriangleAlert, tone: 'amber', filterStatus: 'needsAttention' }
]

const TILE_TONES = {
    deepblue: { bg: 'var(--accelance-deepblue-50)', fg: 'var(--accelance-deepblue-600)' },
    green: { bg: 'var(--accelance-green-100)', fg: 'var(--accelance-green-500)' },
    azure: { bg: 'var(--accelance-azure-50)', fg: 'var(--accelance-azure-400)' },
    amber: { bg: 'var(--accelance-amber-100)', fg: 'var(--accelance-amber-500)' }
}

// Each tab is just a fixed execution-state filter over the same /executions endpoint the general
// Executions page already exposes — Control Tower is a curated front door onto that data.
const TABS = [
    { label: 'Running now', state: 'INPROGRESS', emptyText: 'Nothing running right now' },
    { label: 'Needs approval', state: 'STOPPED', emptyText: 'No approvals waiting' }
]

// Only these two states ever reach this page (the tabs above only ever fetch INPROGRESS or
// STOPPED) — matches the source mockup's own PILL map exactly.
const PILL = {
    STOPPED: {
        pill: 'Awaiting approval',
        bg: 'var(--accelance-amber-100)',
        color: 'var(--accelance-amber-500)',
        dot: 'var(--accelance-amber-300)'
    },
    INPROGRESS: { pill: 'Running', bg: 'var(--accelance-azure-50)', color: 'var(--accelance-azure-500)', dot: 'var(--accelance-azure-400)' }
}

// Distinct from the general Executions page's own localStorage keys ('executions_order'/
// 'executions_orderBy', ExecutionsListTable.jsx) — a separate table instance, sharing keys would
// let sorting here silently change the other page's remembered sort too.
const SORT_ORDER_KEY = 'controlTowerExecutions_order'
const SORT_ORDER_BY_KEY = 'controlTowerExecutions_orderBy'

const parseExecutionData = (execution) =>
    typeof execution.executionData === 'string' ? JSON.parse(execution.executionData) : execution.executionData

const ControlTower = () => {
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

    // Client-side, over whatever page of executions is already loaded — there's no server-side
    // search on this endpoint, so this only searches the current page, not the full result set.
    const [searchTerm, setSearchTerm] = useState('')
    const [order, setOrder] = useState(localStorage.getItem(SORT_ORDER_KEY) || 'desc')
    const [orderBy, setOrderBy] = useState(localStorage.getItem(SORT_ORDER_BY_KEY) || 'updatedDate')

    const [openDrawer, setOpenDrawer] = useState(false)
    const [selectedExecutionData, setSelectedExecutionData] = useState([])
    const [selectedMetadata, setSelectedMetadata] = useState({})

    const navigate = useNavigate()

    const fetchTab = (tabIndex, page, limit) => {
        getAllExecutions.request({ state: TABS[tabIndex].state, page, limit })
    }

    const handleTileClick = (tile) => {
        // Awaiting Approval is an execution-level bucket the page's own tabs already filter to —
        // switch tab in place instead of leaving the page.
        if (tile.key === 'awaitingApproval') {
            handleTabChange(1)
            return
        }
        navigate(tile.filterStatus ? `/agentflows?health=${tile.filterStatus}` : '/agentflows')
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

    const handleTabChange = (newValue) => {
        setActiveTab(newValue)
        setCurrentPage(1)
        fetchTab(newValue, 1, pageLimit)
    }

    const handlePageChange = (page, limit) => {
        setCurrentPage(page)
        setPageLimit(limit)
        fetchTab(activeTab, page, limit)
    }

    const handleExecutionRowClick = (execution) => {
        setOpenDrawer(true)
        // The list row no longer carries executionData (trimmed for payload size) —
        // show what we already know immediately, fetch the full trace by id.
        setSelectedExecutionData([])
        setSelectedMetadata(omit(execution, ['executionData']))
        getExecutionByIdApi.request(execution.id)
    }

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc'
        const newOrder = isAsc ? 'desc' : 'asc'
        setOrder(newOrder)
        setOrderBy(property)
        localStorage.setItem(SORT_ORDER_KEY, newOrder)
        localStorage.setItem(SORT_ORDER_BY_KEY, property)
    }

    const sortCaret = (key) => (orderBy === key ? order === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} /> : null)

    const searchedExecutions = executions.filter((execution) => {
        const term = searchTerm.trim().toLowerCase()
        if (!term) return true
        return execution.agentflow?.name?.toLowerCase().includes(term) || execution.sessionId?.toLowerCase().includes(term)
    })

    const sortedExecutions = [...searchedExecutions].sort((a, b) => {
        if (orderBy === 'name') {
            const aName = a.agentflow?.name || ''
            const bName = b.agentflow?.name || ''
            return order === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName)
        }
        if (orderBy === 'updatedDate' || orderBy === 'createdDate') {
            return order === 'asc' ? new Date(a[orderBy]) - new Date(b[orderBy]) : new Date(b[orderBy]) - new Date(a[orderBy])
        }
        return 0
    })

    const font = { fontFamily: 'var(--accelance-font-primary)' }

    return (
        <div style={{ ...font, display: 'flex', flexDirection: 'column', gap: 24, color: 'var(--accelance-text-primary)' }}>
            {error ? (
                <ErrorBoundary error={error} />
            ) : (
                <>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span
                                style={{
                                    fontSize: 11,
                                    fontWeight: 500,
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    color: 'var(--accelance-azure-400)'
                                }}
                            >
                                Studio
                            </span>
                            <h1 className='acc-text-gradient' style={{ margin: 0, fontSize: 32, lineHeight: '40px', fontWeight: 300 }}>
                                Control Tower
                            </h1>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 16,
                                    lineHeight: '24px',
                                    fontWeight: 300,
                                    color: 'var(--accelance-charcoal-400)'
                                }}
                            >
                                Live health and pending approvals across every agent swarm
                            </p>
                        </div>
                        <div style={{ flex: 1 }} />
                        <button
                            type='button'
                            onClick={refreshAll}
                            className='acc-refresh-btn'
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                height: 40,
                                padding: '0 18px',
                                appearance: 'none',
                                border: '1px solid var(--accelance-azure-400)',
                                borderRadius: 'var(--accelance-radius-button)',
                                background: 'transparent',
                                color: 'var(--accelance-azure-400)',
                                fontSize: 16,
                                fontFamily: 'inherit',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 16 }}>
                        {STAT_TILES.map((tile) => {
                            const tone = TILE_TONES[tile.tone]
                            const Icon = tile.icon
                            return (
                                <button
                                    key={tile.key}
                                    type='button'
                                    onClick={() => handleTileClick(tile)}
                                    className='acc-stat-tile'
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 12,
                                        padding: 24,
                                        appearance: 'none',
                                        textAlign: 'left',
                                        background: 'var(--accelance-white)',
                                        border: '1px solid var(--accelance-charcoal-100)',
                                        borderRadius: 'var(--accelance-radius-button)',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit'
                                    }}
                                >
                                    <span
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 32,
                                            height: 32,
                                            borderRadius: 10,
                                            background: tone.bg
                                        }}
                                    >
                                        <Icon size={18} color={tone.fg} />
                                    </span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <span
                                            className='acc-text-gradient'
                                            style={{ fontSize: 36, lineHeight: '42px', fontWeight: 300, letterSpacing: '-0.02em' }}
                                        >
                                            {stats ? stats[tile.key] ?? 0 : '—'}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 14,
                                                lineHeight: '20px',
                                                fontWeight: 300,
                                                color: 'var(--accelance-charcoal-500)'
                                            }}
                                        >
                                            {tile.label}
                                        </span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'stretch',
                                    background: 'var(--accelance-gradient-skyline-mist-1)',
                                    border: '1px solid var(--accelance-charcoal-100)'
                                }}
                            >
                                {TABS.map((tab, index) => {
                                    const isActive = activeTab === index
                                    return (
                                        <button
                                            key={tab.label}
                                            type='button'
                                            onClick={() => handleTabChange(index)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                height: 44,
                                                padding: '0 20px',
                                                appearance: 'none',
                                                border: 'none',
                                                fontSize: 15,
                                                fontFamily: 'inherit',
                                                cursor: 'pointer',
                                                background: isActive ? 'var(--accelance-white)' : 'transparent',
                                                color: isActive ? 'var(--accelance-charcoal-600)' : 'var(--accelance-azure-400)',
                                                fontWeight: isActive ? 500 : 300,
                                                boxShadow: isActive ? 'inset 0 -2px 0 var(--accelance-azure-400)' : 'none'
                                            }}
                                        >
                                            {tab.label}
                                            {tab.state === 'STOPPED' && stats && (
                                                <span
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        minWidth: 22,
                                                        height: 22,
                                                        padding: '0 6px',
                                                        borderRadius: 'var(--accelance-radius-pill)',
                                                        background: 'var(--accelance-amber-100)',
                                                        color: 'var(--accelance-amber-500)',
                                                        fontSize: 12,
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    {stats.awaitingApproval ?? 0}
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                            <div style={{ flex: 1 }} />
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    height: 44,
                                    width: 340,
                                    padding: '0 16px',
                                    boxSizing: 'border-box',
                                    background: 'var(--accelance-white)',
                                    border: '1px solid var(--accelance-charcoal-200)',
                                    borderRadius: 'var(--accelance-radius-button)'
                                }}
                            >
                                <Search size={16} color='var(--accelance-charcoal-300)' style={{ flex: '0 0 16px' }} />
                                <input
                                    type='text'
                                    placeholder='Search agent swarm or session'
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        border: 'none',
                                        outline: 'none',
                                        background: 'transparent',
                                        fontFamily: 'inherit',
                                        fontSize: 14,
                                        fontWeight: 300,
                                        color: 'var(--accelance-charcoal-600)'
                                    }}
                                />
                            </div>
                        </div>

                        {isLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                                <Loader2 className='acc-spin' size={28} color='var(--accelance-azure-400)' />
                            </div>
                        ) : sortedExecutions.length > 0 ? (
                            <div
                                style={{
                                    background: 'var(--accelance-white)',
                                    border: '1px solid var(--accelance-charcoal-100)',
                                    borderRadius: 'var(--accelance-radius-box)',
                                    boxShadow: 'var(--accelance-shadow-box)',
                                    overflow: 'hidden'
                                }}
                            >
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'minmax(280px, 1fr) 300px 200px 200px',
                                        alignItems: 'center',
                                        height: 52,
                                        padding: '0 24px',
                                        background: 'var(--accelance-gradient-skyline-mist-1)',
                                        borderBottom: '1px solid var(--accelance-charcoal-100)'
                                    }}
                                >
                                    <button type='button' onClick={() => handleRequestSort('name')} style={SORT_HEADER_STYLE}>
                                        Agent swarm {sortCaret('name')}
                                    </button>
                                    <span style={HEADER_LABEL_STYLE}>Session</span>
                                    <button type='button' onClick={() => handleRequestSort('updatedDate')} style={SORT_HEADER_STYLE}>
                                        Last updated {sortCaret('updatedDate')}
                                    </button>
                                    <button type='button' onClick={() => handleRequestSort('createdDate')} style={SORT_HEADER_STYLE}>
                                        Created {sortCaret('createdDate')}
                                    </button>
                                </div>

                                {sortedExecutions.map((execution) => {
                                    const pill = PILL[execution.state] || PILL.INPROGRESS
                                    return (
                                        <div
                                            key={execution.id}
                                            role='button'
                                            tabIndex={0}
                                            onClick={() => handleExecutionRowClick(execution)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault()
                                                    handleExecutionRowClick(execution)
                                                }
                                            }}
                                            className='acc-table-row'
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'minmax(280px, 1fr) 300px 200px 200px',
                                                alignItems: 'center',
                                                minHeight: 64,
                                                padding: '0 24px',
                                                borderBottom: '1px solid var(--accelance-charcoal-100)',
                                                cursor: 'pointer',
                                                background: 'var(--accelance-white)'
                                            }}
                                        >
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 24 }}>
                                                <span
                                                    style={{
                                                        width: 8,
                                                        height: 8,
                                                        flex: '0 0 8px',
                                                        borderRadius: 999,
                                                        background: pill.dot
                                                    }}
                                                />
                                                <span style={{ fontSize: 15, fontWeight: 400, color: 'var(--accelance-charcoal-600)' }}>
                                                    {execution.agentflow?.name}
                                                </span>
                                                <span
                                                    style={{
                                                        padding: '2px 10px',
                                                        borderRadius: 'var(--accelance-radius-pill)',
                                                        fontSize: 11,
                                                        fontWeight: 500,
                                                        background: pill.bg,
                                                        color: pill.color
                                                    }}
                                                >
                                                    {pill.pill}
                                                </span>
                                            </span>
                                            <span
                                                style={{
                                                    fontFamily: 'var(--accelance-font-mono)',
                                                    fontSize: '12.5px',
                                                    color: 'var(--accelance-charcoal-400)',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    paddingRight: 16
                                                }}
                                            >
                                                {execution.sessionId}
                                            </span>
                                            <span style={{ fontSize: 14, fontWeight: 300, color: 'var(--accelance-charcoal-600)' }}>
                                                {moment(execution.updatedDate).format('MMM D, YYYY h:mm A')}
                                            </span>
                                            <span style={{ fontSize: 14, fontWeight: 300, color: 'var(--accelance-charcoal-400)' }}>
                                                {moment(execution.createdDate).format('MMM D, YYYY h:mm A')}
                                            </span>
                                        </div>
                                    )
                                })}

                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 16,
                                        padding: '16px 24px',
                                        background: 'var(--accelance-gradient-soft-horizon)'
                                    }}
                                >
                                    <TablePagination
                                        currentPage={currentPage}
                                        limit={pageLimit}
                                        total={total}
                                        onChange={handlePageChange}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '88px 24px',
                                    background: 'var(--accelance-gradient-soft-horizon)',
                                    border: '1px solid var(--accelance-charcoal-100)',
                                    borderRadius: 'var(--accelance-radius-box)'
                                }}
                            >
                                <img src={execution_empty} alt='' style={{ height: 96, width: 'auto', objectFit: 'contain' }} />
                                <span style={{ fontSize: 20, lineHeight: '32px', fontWeight: 300, color: 'var(--accelance-deepblue-600)' }}>
                                    {searchTerm ? `No agent swarm or session matches “${searchTerm}”.` : TABS[activeTab].emptyText}
                                </span>
                            </div>
                        )}
                    </div>

                    <ExecutionDetails
                        open={openDrawer}
                        execution={selectedExecutionData}
                        metadata={selectedMetadata}
                        loading={getExecutionByIdApi.loading}
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
            )}
        </div>
    )
}

const HEADER_LABEL_STYLE = {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--accelance-charcoal-500)'
}

const SORT_HEADER_STYLE = {
    ...HEADER_LABEL_STYLE,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    appearance: 'none',
    border: 'none',
    background: 'transparent',
    padding: 0,
    fontFamily: 'inherit',
    cursor: 'pointer'
}

export default ControlTower
