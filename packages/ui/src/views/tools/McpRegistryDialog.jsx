import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'

import {
    Box,
    Button,
    Typography,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    OutlinedInput,
    TextField,
    Chip,
    CircularProgress,
    Alert,
    Link
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { StyledButton } from '@/ui-component/button/StyledButton'

// Icons
import { IconX, IconSearch, IconDownload, IconCheck, IconAlertTriangle, IconExternalLink } from '@tabler/icons-react'

// API
import mcpRegistryApi from '@/api/mcpRegistry'

// Hooks
import useNotifier from '@/utils/useNotifier'

const SEARCH_DEBOUNCE_MS = 400

const getErrorMsg = (error) =>
    typeof error.response?.data === 'object' ? error.response.data.message : error.response?.data || error.message

const TRANSPORT_LABEL = {
    remote: 'Remote server',
    stdio: 'Runs locally',
    unsupported: 'Not supported yet'
}

// One search result row. Manages its own required-field inputs and import state so
// importing one entry never blocks or resets the rest of the list.
const McpRegistryRow = ({ server, showSnackbar, onImported }) => {
    const [values, setValues] = useState({})
    const [showStdioWarning, setShowStdioWarning] = useState(false)
    const [importing, setImporting] = useState(false)
    const [imported, setImported] = useState(false)

    const declaredInputs = server.transport === 'remote' ? server.remote?.headers || [] : server.stdio?.environmentVariables || []
    const missingRequired = declaredInputs.some((input) => input.isRequired && !values[input.name])

    const runImport = async () => {
        setImporting(true)
        try {
            await mcpRegistryApi.importServer({
                registryId: server.id,
                transport: server.transport,
                ...(server.transport === 'remote' ? { headerValues: values } : { envValues: values })
            })
            setImported(true)
            showSnackbar(`Added "${server.name}" to My MCP Servers`)
            onImported()
        } catch (error) {
            showSnackbar(getErrorMsg(error), 'error')
        } finally {
            setImporting(false)
        }
    }

    const handleImportClick = () => {
        if (server.transport === 'stdio' && !showStdioWarning) {
            setShowStdioWarning(true)
            return
        }
        runImport()
    }

    return (
        <Stack spacing={1} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Stack direction='row' alignItems='flex-start' spacing={2}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Stack direction='row' alignItems='center' spacing={1}>
                        <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                            {server.name}
                        </Typography>
                        <Chip
                            label={TRANSPORT_LABEL[server.transport]}
                            size='small'
                            color={server.transport === 'unsupported' ? 'default' : server.transport === 'stdio' ? 'warning' : 'success'}
                        />
                    </Stack>
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                        {server.description}
                    </Typography>
                    {server.repositoryUrl && (
                        <Link
                            href={server.repositoryUrl}
                            target='_blank'
                            rel='noopener'
                            variant='caption'
                            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
                        >
                            View source <IconExternalLink size={12} />
                        </Link>
                    )}
                </Box>
                <Button
                    variant={imported ? 'text' : 'outlined'}
                    size='small'
                    color={imported ? 'success' : 'primary'}
                    disabled={imported || importing || server.transport === 'unsupported' || missingRequired}
                    onClick={handleImportClick}
                    startIcon={imported ? <IconCheck size={16} /> : importing ? <CircularProgress size={14} /> : <IconDownload size={16} />}
                    sx={{ flexShrink: 0 }}
                >
                    {imported ? 'Added' : 'Add'}
                </Button>
            </Stack>

            {declaredInputs.length > 0 && !imported && (
                <Stack spacing={1} sx={{ pl: 0 }}>
                    {declaredInputs.map((input) => (
                        <TextField
                            key={input.name}
                            size='small'
                            label={`${input.name}${input.isRequired ? ' (required)' : ''}`}
                            helperText={input.valueHint ? `Expected format: ${input.valueHint}` : input.description}
                            type={input.isSecret ? 'password' : 'text'}
                            value={values[input.name] || ''}
                            onChange={(e) => setValues((prev) => ({ ...prev, [input.name]: e.target.value }))}
                        />
                    ))}
                </Stack>
            )}

            {showStdioWarning && !imported && (
                <Alert severity='warning' icon={<IconAlertTriangle size={18} />}>
                    This runs third-party code (
                    <code>
                        {server.stdio?.registryType === 'npm' ? 'npx' : 'uvx'} {server.stdio?.identifier}
                    </code>
                    ) directly on our infrastructure — nobody on our side has reviewed it. Only add servers you trust.
                    <Box sx={{ mt: 1 }}>
                        <Button size='small' variant='contained' color='warning' onClick={runImport} disabled={importing}>
                            I understand, add it anyway
                        </Button>
                    </Box>
                </Alert>
            )}
        </Stack>
    )
}

McpRegistryRow.propTypes = {
    server: PropTypes.object.isRequired,
    showSnackbar: PropTypes.func.isRequired,
    onImported: PropTypes.func.isRequired
}

const McpRegistryDialog = ({ show, onCancel, onImported }) => {
    const theme = useTheme()
    const dispatch = useDispatch()
    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [searching, setSearching] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const searchDebounceRef = useRef(null)

    const showSnackbar = (message, variant = 'success') => {
        enqueueSnackbar({
            message,
            options: {
                key: new Date().getTime() + Math.random(),
                variant,
                action: (key) => (
                    <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                        <IconX />
                    </Button>
                ),
                ...(variant === 'error' && { persist: true })
            }
        })
    }

    useEffect(() => {
        if (!show) return
        setQuery('')
        setResults([])
        setHasSearched(false)
    }, [show])

    const runSearch = useCallback((searchQuery) => {
        setSearching(true)
        mcpRegistryApi
            .searchServers(searchQuery)
            .then((resp) => setResults(resp.data?.servers || []))
            .catch((error) => showSnackbar(getErrorMsg(error), 'error'))
            .finally(() => {
                setSearching(false)
                setHasSearched(true)
            })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onQueryChange = (e) => {
        const value = e.target.value
        setQuery(value)
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
        searchDebounceRef.current = setTimeout(() => runSearch(value), SEARCH_DEBOUNCE_MS)
    }

    const component = show ? (
        <Dialog open={show} onClose={onCancel} fullWidth maxWidth='sm' aria-labelledby='mcp-registry-dialog-title'>
            <DialogTitle id='mcp-registry-dialog-title' sx={{ fontSize: '1.1rem' }}>
                Browse MCP Registry
            </DialogTitle>
            <DialogContent>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                    Search the official public MCP registry and add any server directly to My MCP Servers — no code required. Servers that
                    run locally (via npx/uvx) execute third-party code on our infrastructure; you&apos;ll be asked to confirm before those
                    are added.
                </Typography>
                <Stack spacing={2}>
                    <OutlinedInput
                        fullWidth
                        size='small'
                        placeholder='Search MCP servers, e.g. "notion" or "filesystem"'
                        value={query}
                        onChange={onQueryChange}
                        startAdornment={<IconSearch size={18} style={{ marginRight: 8, opacity: 0.6 }} />}
                    />
                    <Box sx={{ maxHeight: 460, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        {searching && (
                            <Box display='flex' justifyContent='center' sx={{ py: 4 }}>
                                <CircularProgress size={24} />
                            </Box>
                        )}
                        {!searching && hasSearched && results.length === 0 && (
                            <Typography variant='body2' color='text.secondary' sx={{ p: 2, textAlign: 'center' }}>
                                No servers found for &quot;{query}&quot;.
                            </Typography>
                        )}
                        {!searching &&
                            results.map((server) => (
                                <McpRegistryRow key={server.id} server={server} showSnackbar={showSnackbar} onImported={onImported} />
                            ))}
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions>
                <StyledButton variant='outlined' onClick={onCancel} sx={{ color: theme?.palette?.text?.primary }}>
                    Close
                </StyledButton>
            </DialogActions>
        </Dialog>
    ) : null

    const portalElement = document.getElementById('portal')
    return createPortal(component, portalElement)
}

McpRegistryDialog.propTypes = {
    show: PropTypes.bool,
    onCancel: PropTypes.func,
    onImported: PropTypes.func
}

export default McpRegistryDialog
