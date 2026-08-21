import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'
import moment from 'moment'

// material-ui
import { styled } from '@mui/material/styles'
import { tableCellClasses } from '@mui/material/TableCell'
import {
    Button,
    Box,
    CircularProgress,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography
} from '@mui/material'

// project imports
import TablePagination, { DEFAULT_ITEMS_PER_PAGE } from '@/ui-component/pagination/TablePagination'

// API
import guardrailsApi from '@/api/guardrails'

// utils
import useNotifier from '@/utils/useNotifier'

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    borderColor: theme.palette.divider,
    [`&.${tableCellClasses.head}`]: {
        color: theme.palette.grey[900]
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 13
    }
}))

const StyledTableRow = styled(TableRow)(() => ({
    '&:last-child td, &:last-child th': {
        border: 0
    }
}))

const VERDICT_COLOR = { pass: 'success', flag: 'warning', block: 'error', redact: 'info', require_approval: 'secondary' }

/**
 * Guardrails v2 Phase 4 -- the first UI ever to read GuardrailVerdict (write-only through
 * Phases 1-3). Same plain-MUI-table + TablePagination pattern views/variables/index.jsx
 * already uses (real pagination, not a DataGrid) -- this feature area
 * (migration-checklist.md rows 25-28) stays plain MUI throughout, not a Tailwind/shadcn
 * rebuild. Rendered as a new section on the existing /guardrails page rather than a new
 * top-level nav item, to avoid the icon-registry gotcha logged in known-issues.md #012 for a
 * view this narrow in scope.
 */
const VerdictAuditTrail = () => {
    const dispatch = useDispatch()
    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [verdicts, setVerdicts] = useState([])
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageLimit, setPageLimit] = useState(DEFAULT_ITEMS_PER_PAGE)
    const [total, setTotal] = useState(0)

    const showError = (message) => {
        enqueueSnackbar({
            message,
            options: {
                key: new Date().getTime() + Math.random(),
                variant: 'error',
                persist: true,
                action: (key) => (
                    <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                        Dismiss
                    </Button>
                )
            }
        })
    }

    const refresh = async (page, limit) => {
        setLoading(true)
        try {
            const res = await guardrailsApi.listVerdicts({ page: page || currentPage, limit: limit || pageLimit })
            setVerdicts(res.data.data)
            setTotal(res.data.total)
        } catch (err) {
            showError(err?.response?.data?.message || 'Failed to load guardrail verdicts')
        } finally {
            setLoading(false)
        }
    }

    const onChange = (page, limit) => {
        setCurrentPage(page)
        setPageLimit(limit)
        refresh(page, limit)
    }

    useEffect(() => {
        refresh(currentPage, pageLimit)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <Box sx={{ mt: 3 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 1.5 }}>Recent Verdicts</Typography>
            <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <Table size='small'>
                    <TableHead>
                        <TableRow>
                            <StyledTableCell>When</StyledTableCell>
                            <StyledTableCell>Chatflow</StyledTableCell>
                            <StyledTableCell>Definition</StyledTableCell>
                            <StyledTableCell>Verdict</StyledTableCell>
                            <StyledTableCell>Mode</StyledTableCell>
                            <StyledTableCell>Reason</StyledTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <StyledTableRow>
                                <StyledTableCell colSpan={6} sx={{ border: 0 }}>
                                    <Box display='flex' alignItems='center' justifyContent='center' sx={{ py: 4 }}>
                                        <CircularProgress size={20} />
                                    </Box>
                                </StyledTableCell>
                            </StyledTableRow>
                        ) : verdicts.length === 0 ? (
                            <StyledTableRow>
                                <StyledTableCell colSpan={6} sx={{ border: 0 }}>
                                    <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary', fontSize: '0.85rem' }}>
                                        No guardrail verdicts recorded yet for this workspace.
                                    </Typography>
                                </StyledTableCell>
                            </StyledTableRow>
                        ) : (
                            verdicts.map((v) => (
                                <StyledTableRow key={v.id}>
                                    <StyledTableCell>{moment(v.createdDate).format('MMM D, YYYY HH:mm:ss')}</StyledTableCell>
                                    <StyledTableCell>{v.chatflowId}</StyledTableCell>
                                    <StyledTableCell>{v.definitionKey}</StyledTableCell>
                                    <StyledTableCell>
                                        <Chip size='small' label={v.verdict} color={VERDICT_COLOR[v.verdict] || 'default'} />
                                    </StyledTableCell>
                                    <StyledTableCell>{v.observeMode ? 'Observe' : 'Enforce'}</StyledTableCell>
                                    <StyledTableCell>{v.reason || '-'}</StyledTableCell>
                                </StyledTableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            {total > 0 && <TablePagination currentPage={currentPage} limit={pageLimit} total={total} onChange={onChange} />}
        </Box>
    )
}

export default VerdictAuditTrail
