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
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    CircularProgress,
    Avatar
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { StyledButton } from '@/ui-component/button/StyledButton'

// Icons
import { IconX, IconSearch, IconDownload, IconCheck } from '@tabler/icons-react'

// API
import credentialsApi from '@/api/credentials'
import composioCatalogApi from '@/api/composioCatalog'

// Hooks
import useNotifier from '@/utils/useNotifier'

const SEARCH_DEBOUNCE_MS = 400

const getErrorMsg = (error) =>
    typeof error.response?.data === 'object' ? error.response.data.message : error.response?.data || error.message

// One search result row. Manages its own connected-account lookup so importing one
// action never blocks or resets the rest of the list.
const ComposioActionRow = ({ action, credentialId, showSnackbar, onImported }) => {
    const [connections, setConnections] = useState(null) // null = not fetched yet
    const [selectedConnectionId, setSelectedConnectionId] = useState('')
    const [loadingConnections, setLoadingConnections] = useState(false)
    const [importing, setImporting] = useState(false)
    const [imported, setImported] = useState(false)

    const needsConnectionPicker = !action.noAuth && connections !== null

    const runImport = async (connectedAccountId) => {
        setImporting(true)
        try {
            await composioCatalogApi.importAction({
                credentialId,
                actionName: action.name,
                connectedAccountId
            })
            setImported(true)
            showSnackbar(`Imported "${action.displayName}" to My Tools`)
            onImported()
        } catch (error) {
            showSnackbar(getErrorMsg(error), 'error')
        } finally {
            setImporting(false)
        }
    }

    const handleImportClick = async () => {
        if (action.noAuth) {
            await runImport(undefined)
            return
        }
        if (connections === null) {
            setLoadingConnections(true)
            try {
                const resp = await composioCatalogApi.listConnections(credentialId, action.appName)
                setConnections(resp.data || [])
            } catch (error) {
                showSnackbar(getErrorMsg(error), 'error')
                setConnections([])
            } finally {
                setLoadingConnections(false)
            }
            return
        }
        if (selectedConnectionId) {
            await runImport(selectedConnectionId)
        }
    }

    return (
        <Stack direction='row' alignItems='flex-start' spacing={2} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Avatar src={action.logo} variant='rounded' sx={{ width: 32, height: 32, bgcolor: 'transparent' }}>
                {action.appName?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Stack direction='row' alignItems='center' spacing={1}>
                    <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                        {action.displayName}
                    </Typography>
                    {action.appName && <Chip label={action.appName} size='small' />}
                </Stack>
                <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                    {action.description}
                </Typography>
                {needsConnectionPicker && connections.length > 0 && (
                    <FormControl size='small' sx={{ mt: 1, minWidth: 240 }}>
                        <InputLabel>Connected Account</InputLabel>
                        <Select
                            label='Connected Account'
                            value={selectedConnectionId}
                            onChange={(e) => setSelectedConnectionId(e.target.value)}
                        >
                            {connections.map((c) => (
                                <MenuItem key={c.id} value={c.id}>
                                    {c.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
                {needsConnectionPicker && connections.length === 0 && (
                    <Typography variant='caption' color='error' sx={{ display: 'block', mt: 1 }}>
                        No connected account for {action.appName}. Connect it on app.composio.dev first, then try again.
                    </Typography>
                )}
            </Box>
            <Button
                variant={imported ? 'text' : 'outlined'}
                size='small'
                color={imported ? 'success' : 'primary'}
                disabled={
                    imported ||
                    importing ||
                    loadingConnections ||
                    (needsConnectionPicker && connections.length > 0 && !selectedConnectionId)
                }
                onClick={handleImportClick}
                startIcon={
                    imported ? (
                        <IconCheck size={16} />
                    ) : importing || loadingConnections ? (
                        <CircularProgress size={14} />
                    ) : (
                        <IconDownload size={16} />
                    )
                }
                sx={{ flexShrink: 0, mt: 0.5 }}
            >
                {imported ? 'Imported' : loadingConnections ? 'Loading…' : 'Import'}
            </Button>
        </Stack>
    )
}

ComposioActionRow.propTypes = {
    action: PropTypes.object.isRequired,
    credentialId: PropTypes.string.isRequired,
    showSnackbar: PropTypes.func.isRequired,
    onImported: PropTypes.func.isRequired
}

const ComposioImportDialog = ({ show, onCancel, onImported }) => {
    const theme = useTheme()
    const dispatch = useDispatch()
    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [credentials, setCredentials] = useState([])
    const [credentialId, setCredentialId] = useState('')
    const [loadingCredentials, setLoadingCredentials] = useState(false)
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
        setLoadingCredentials(true)
        credentialsApi
            .getCredentialsByName('composioApi')
            .then((resp) => {
                const list = resp.data || []
                setCredentials(list)
                if (list.length > 0) setCredentialId(list[0].id)
            })
            .catch((error) => showSnackbar(getErrorMsg(error), 'error'))
            .finally(() => setLoadingCredentials(false))
        setQuery('')
        setResults([])
        setHasSearched(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show])

    const runSearch = useCallback(
        (searchQuery) => {
            if (!credentialId) return
            setSearching(true)
            composioCatalogApi
                .searchActions(credentialId, searchQuery)
                .then((resp) => setResults(resp.data || []))
                .catch((error) => showSnackbar(getErrorMsg(error), 'error'))
                .finally(() => {
                    setSearching(false)
                    setHasSearched(true)
                })
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [credentialId]
    )

    const onQueryChange = (e) => {
        const value = e.target.value
        setQuery(value)
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
        searchDebounceRef.current = setTimeout(() => runSearch(value), SEARCH_DEBOUNCE_MS)
    }

    const component = show ? (
        <Dialog open={show} onClose={onCancel} fullWidth maxWidth='sm' aria-labelledby='composio-import-dialog-title'>
            <DialogTitle id='composio-import-dialog-title' sx={{ fontSize: '1.1rem' }}>
                Import from Composio
            </DialogTitle>
            <DialogContent>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                    Search Composio&apos;s action catalog and import the specific ones you need as your own named tools — no code required.
                </Typography>
                {loadingCredentials ? (
                    <Box display='flex' justifyContent='center' sx={{ py: 4 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : credentials.length === 0 ? (
                    <Typography variant='body2' color='error'>
                        No Composio credential found for this workspace. Add a Composio API Key credential first, then come back here.
                    </Typography>
                ) : (
                    <Stack spacing={2}>
                        {credentials.length > 1 && (
                            <FormControl size='small' fullWidth>
                                <InputLabel>Composio Credential</InputLabel>
                                <Select label='Composio Credential' value={credentialId} onChange={(e) => setCredentialId(e.target.value)}>
                                    {credentials.map((c) => (
                                        <MenuItem key={c.id} value={c.id}>
                                            {c.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        <OutlinedInput
                            fullWidth
                            size='small'
                            placeholder='Search actions, e.g. "notion" or "create page"'
                            value={query}
                            onChange={onQueryChange}
                            startAdornment={<IconSearch size={18} style={{ marginRight: 8, opacity: 0.6 }} />}
                        />
                        <Box sx={{ maxHeight: 420, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                            {searching && (
                                <Box display='flex' justifyContent='center' sx={{ py: 4 }}>
                                    <CircularProgress size={24} />
                                </Box>
                            )}
                            {!searching && hasSearched && results.length === 0 && (
                                <Typography variant='body2' color='text.secondary' sx={{ p: 2, textAlign: 'center' }}>
                                    No actions found for &quot;{query}&quot;.
                                </Typography>
                            )}
                            {!searching &&
                                results.map((action) => (
                                    <ComposioActionRow
                                        key={action.name}
                                        action={action}
                                        credentialId={credentialId}
                                        showSnackbar={showSnackbar}
                                        onImported={onImported}
                                    />
                                ))}
                        </Box>
                    </Stack>
                )}
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

ComposioImportDialog.propTypes = {
    show: PropTypes.bool,
    onCancel: PropTypes.func,
    onImported: PropTypes.func
}

export default ComposioImportDialog
