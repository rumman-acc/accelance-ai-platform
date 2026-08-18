import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import { Typography, Stack, Button, OutlinedInput, CircularProgress } from '@mui/material'
import { IconPlus } from '@tabler/icons-react'

// project imports
import { StyledButton } from '@/ui-component/button/StyledButton'
import GuardrailRow from '@/ui-component/extended/GuardrailRow'

// API
import guardrailsApi from '@/api/guardrails'

// hooks
import useNotifier from '@/utils/useNotifier'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'

const SOURCE_LABEL = {
    'overridden-for-this-agent': { text: 'Overridden for this agent', color: '#2196f3' },
    'workspace-default': { text: 'Workspace default', color: '#9c27b0' },
    'tool-access-policy': { text: 'Configured', color: '#16a34a' },
    'canvas-node': { text: 'On canvas', color: '#16a34a' },
    none: { text: 'Off', color: '#9e9e9e' }
}

const GuardrailsCompliance = ({ hideTitle = false }) => {
    const dispatch = useDispatch()
    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const chatflow = useSelector((state) => state.canvas.chatflow)
    const chatflowId = chatflow?.id

    const [items, setItems] = useState(null)
    const [loading, setLoading] = useState(false)
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

    const loadSummary = async () => {
        if (!chatflowId) return
        setLoading(true)
        try {
            const res = await guardrailsApi.getSummary(chatflowId)
            setItems(res.data.items)
        } catch (err) {
            showError(err?.response?.data?.message || 'Failed to load Guardrails summary')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadSummary()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatflowId])

    const onTogglePolicy = async (catalogKey, enabled) => {
        try {
            await guardrailsApi.upsertPolicy({ chatflowId, catalogKey, enabled })
            await loadSummary()
        } catch (err) {
            showError(err?.response?.data?.message || 'Failed to update guardrail')
        }
    }

    const onAddCustom = async () => {
        if (!newName.trim() || !newDescription.trim()) return
        try {
            await guardrailsApi.createCustomCatalogItem({ name: newName.trim(), description: newDescription.trim() })
            setNewName('')
            setNewDescription('')
            setShowAddForm(false)
            await loadSummary()
        } catch (err) {
            showError(err?.response?.data?.message || 'Failed to create custom guardrail')
        }
    }

    return (
        <Stack direction='column' spacing={2} sx={{ width: '100%' }}>
            {!hideTitle && <Typography variant='h3'>Guardrails</Typography>}

            {loading && !items && <CircularProgress size={20} />}

            {items && (
                <Stack direction='column' spacing={1.5}>
                    {items.map((item) => {
                        const sourceInfo = SOURCE_LABEL[item.source] || SOURCE_LABEL.none
                        const isPlanned = item.enforcementStatus === 'planned'
                        const isNode = item.kind === 'node'
                        const isToolAllowlist = item.catalogKey === 'tool_allowlist'

                        const badges = [
                            { label: item.active ? sourceInfo.text : 'Off', bg: `${sourceInfo.color}1a`, color: sourceInfo.color }
                        ]
                        if (isPlanned)
                            badges.push({ label: 'Planned — not yet enforced', bg: 'rgba(158,158,158,0.15)', color: 'text.secondary' })

                        let hint
                        if (isNode) hint = 'Drag the matching node onto the canvas to enable this for this agent.'
                        else if (isToolAllowlist) hint = 'Managed via Tool Access Policy.'

                        return (
                            <GuardrailRow
                                key={item.catalogKey}
                                testId={`guardrail-row-${item.catalogKey}`}
                                name={item.name}
                                description={item.description}
                                badges={badges}
                                hint={hint}
                                showSwitch={!isNode && !isToolAllowlist}
                                switchValue={item.active}
                                switchDisabled={isPlanned}
                                onToggle={(val) => onTogglePolicy(item.catalogKey, val)}
                            />
                        )
                    })}
                </Stack>
            )}

            {showAddForm ? (
                <Stack direction='column' spacing={1.5} sx={{ p: 1.5, borderRadius: '8px', border: '1px solid', borderColor: 'divider' }}>
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
                <Button startIcon={<IconPlus size={16} />} onClick={() => setShowAddForm(true)} sx={{ alignSelf: 'flex-start' }}>
                    Add Custom Guardrail
                </Button>
            )}
        </Stack>
    )
}

GuardrailsCompliance.propTypes = {
    hideTitle: PropTypes.bool
}

export default GuardrailsCompliance
