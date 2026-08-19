import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import { Typography, Stack, Button, CircularProgress } from '@mui/material'

// project imports
import GuardrailRow from '@/ui-component/extended/GuardrailRow'

// API
import guardrailsApi from '@/api/guardrails'

// hooks
import useNotifier from '@/utils/useNotifier'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'

const SOURCE_LABEL = {
    'overridden-for-this-agent': { text: 'Overridden for this agent', color: '#2196f3' },
    'workspace-default': { text: 'Workspace default', color: '#9c27b0' },
    attached: { text: 'On', color: '#16a34a' },
    'tool-access-policy': { text: 'Configured', color: '#16a34a' },
    'canvas-node': { text: 'On canvas', color: '#16a34a' },
    none: { text: 'Off', color: '#9e9e9e' }
}

/**
 * Guardrails v2 -- the custom-catalog "Add Custom Guardrail" authoring form that used to live
 * here is removed per build-plan §2.2 (custom-catalog authoring is deleted, not deferred; a
 * different, schema-driven authoring flow is Phase 3 work). This panel is otherwise unchanged:
 * per-agent overrides for the real, toggleable items still write to GuardrailPolicy via
 * upsertPolicy, same as before.
 */
const GuardrailsCompliance = ({ hideTitle = false }) => {
    const dispatch = useDispatch()
    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const chatflow = useSelector((state) => state.canvas.chatflow)
    const chatflowId = chatflow?.id

    const [items, setItems] = useState(null)
    const [loading, setLoading] = useState(false)

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

    return (
        <Stack direction='column' spacing={2} sx={{ width: '100%' }}>
            {!hideTitle && <Typography variant='h3'>Guardrails</Typography>}

            {loading && !items && <CircularProgress size={20} />}

            {items && (
                <Stack direction='column' spacing={1.5}>
                    {items.map((item) => {
                        const sourceInfo = SOURCE_LABEL[item.source] || SOURCE_LABEL.none
                        const badges = [
                            { label: item.active ? sourceInfo.text : 'Off', bg: `${sourceInfo.color}1a`, color: sourceInfo.color }
                        ]

                        let hint
                        if (item.isNode) hint = 'Drag the matching node onto the canvas to enable this for this agent.'
                        else if (item.isToolAllowlist) hint = 'Managed via Tool Access Policy.'

                        return (
                            <GuardrailRow
                                key={item.catalogKey}
                                testId={`guardrail-row-${item.catalogKey}`}
                                name={item.name}
                                description={item.description}
                                badges={badges}
                                hint={hint}
                                showSwitch={!item.isNode && !item.isToolAllowlist}
                                switchValue={item.active}
                                onToggle={(val) => onTogglePolicy(item.catalogKey, val)}
                            />
                        )
                    })}
                </Stack>
            )}
        </Stack>
    )
}

GuardrailsCompliance.propTypes = {
    hideTitle: PropTypes.bool
}

export default GuardrailsCompliance
