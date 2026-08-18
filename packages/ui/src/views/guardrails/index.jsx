import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'

// material-ui
import { Button, Stack, OutlinedInput, CircularProgress } from '@mui/material'
import { IconPlus } from '@tabler/icons-react'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import ErrorBoundary from '@/ErrorBoundary'
import { StyledButton } from '@/ui-component/button/StyledButton'
import { Available } from '@/ui-component/rbac/available'
import GuardrailRow from '@/ui-component/extended/GuardrailRow'

// API
import guardrailsApi from '@/api/guardrails'

// utils
import useNotifier from '@/utils/useNotifier'

const WORKSPACE_WIDE = ''

const buildRows = (catalog, policies) => {
    return catalog.map((item) => {
        const workspaceRow = policies.find((p) => p.catalogKey === item.key && p.chatflowId === WORKSPACE_WIDE)
        const overrideCount = policies.filter((p) => p.catalogKey === item.key && p.chatflowId !== WORKSPACE_WIDE && p.enabled).length
        return {
            catalogKey: item.key,
            name: item.name,
            description: item.description,
            kind: item.kind,
            enforcementStatus: item.enforcementStatus,
            active: !!workspaceRow?.enabled,
            overrideCount
        }
    })
}

const GuardrailsPage = () => {
    const dispatch = useDispatch()
    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [rows, setRows] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [showAddForm, setShowAddForm] = useState(false)
    const [newName, setNewName] = useState('')
    const [newDescription, setNewDescription] = useState('')

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

    const load = async () => {
        setLoading(true)
        try {
            const [catalogRes, policiesRes] = await Promise.all([guardrailsApi.getCatalog(), guardrailsApi.getPolicies()])
            setRows(buildRows(catalogRes.data, policiesRes.data))
        } catch (err) {
            setError(err)
            showError(err?.response?.data?.message || 'Failed to load the Guardrails catalog')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onToggleWorkspaceDefault = async (catalogKey, enabled) => {
        try {
            await guardrailsApi.upsertPolicy({ catalogKey, enabled })
            await load()
        } catch (err) {
            showError(err?.response?.data?.message || 'Failed to update workspace default')
        }
    }

    const onAddCustom = async () => {
        if (!newName.trim() || !newDescription.trim()) return
        try {
            await guardrailsApi.createCustomCatalogItem({ name: newName.trim(), description: newDescription.trim() })
            setNewName('')
            setNewDescription('')
            setShowAddForm(false)
            await load()
        } catch (err) {
            showError(err?.response?.data?.message || 'Failed to create custom guardrail')
        }
    }

    return (
        <>
            <MainCard>
                {error ? (
                    <ErrorBoundary error={error} />
                ) : (
                    <Stack flexDirection='column' sx={{ gap: 3 }}>
                        <ViewHeader
                            title='Guardrails'
                            description="Workspace-wide defaults for runtime safety controls applied to every agent. Override per-agent from that agent's own canvas settings."
                        />

                        {loading && !rows && <CircularProgress size={20} />}

                        {rows && (
                            <Stack direction='column' spacing={1.5}>
                                {rows.map((item) => {
                                    const isPlanned = item.enforcementStatus === 'planned'
                                    const isNode = item.kind === 'node'
                                    const isToolAllowlist = item.catalogKey === 'tool_allowlist'

                                    const badges = [
                                        {
                                            label: item.active ? 'Workspace default: ON' : 'Workspace default: OFF',
                                            bg: item.active ? 'rgba(22,163,74,0.1)' : 'rgba(158,158,158,0.15)',
                                            color: item.active ? '#16a34a' : 'text.secondary'
                                        }
                                    ]
                                    if (isPlanned)
                                        badges.push({
                                            label: 'Planned — not yet enforced',
                                            bg: 'rgba(158,158,158,0.15)',
                                            color: 'text.secondary'
                                        })
                                    if (item.overrideCount > 0) {
                                        badges.push({
                                            label: `Overridden by ${item.overrideCount} agent${item.overrideCount > 1 ? 's' : ''}`,
                                            bg: 'rgba(33,150,243,0.1)',
                                            color: '#2196f3'
                                        })
                                    }

                                    let hint
                                    if (isNode)
                                        hint =
                                            "No workspace-wide default — enabled per-agent by dragging the matching node onto that agent's canvas."
                                    else if (isToolAllowlist)
                                        hint = "Managed via Tool Access Policy, configured per-agent from each agent's canvas."

                                    return (
                                        <GuardrailRow
                                            key={item.catalogKey}
                                            testId={`guardrail-workspace-row-${item.catalogKey}`}
                                            name={item.name}
                                            description={item.description}
                                            badges={badges}
                                            hint={hint}
                                            showSwitch={!isNode && !isToolAllowlist}
                                            switchValue={item.active}
                                            switchDisabled={isPlanned}
                                            onToggle={(val) => onToggleWorkspaceDefault(item.catalogKey, val)}
                                        />
                                    )
                                })}
                            </Stack>
                        )}

                        <Available permission='guardrails:manage'>
                            {showAddForm ? (
                                <Stack
                                    direction='column'
                                    spacing={1.5}
                                    sx={{ p: 1.5, borderRadius: '8px', border: '1px solid', borderColor: 'divider' }}
                                >
                                    <OutlinedInput
                                        size='small'
                                        fullWidth
                                        placeholder='Guardrail name'
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                    />
                                    <OutlinedInput
                                        size='small'
                                        fullWidth
                                        placeholder='What does it check or block?'
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                    />
                                    <Stack direction='row' spacing={1} justifyContent='flex-end'>
                                        <Button onClick={() => setShowAddForm(false)}>Cancel</Button>
                                        <StyledButton variant='contained' onClick={onAddCustom}>
                                            Add
                                        </StyledButton>
                                    </Stack>
                                </Stack>
                            ) : (
                                <Button
                                    startIcon={<IconPlus size={16} />}
                                    onClick={() => setShowAddForm(true)}
                                    sx={{ alignSelf: 'flex-start' }}
                                >
                                    Add Custom Guardrail
                                </Button>
                            )}
                        </Available>
                    </Stack>
                )}
            </MainCard>
        </>
    )
}

export default GuardrailsPage
