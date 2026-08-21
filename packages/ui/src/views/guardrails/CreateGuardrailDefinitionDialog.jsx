import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'

import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    OutlinedInput,
    Select,
    Stack,
    Typography
} from '@mui/material'
import { StyledButton } from '@/ui-component/button/StyledButton'
import { TooltipWithParser } from '@/ui-component/tooltip/TooltipWithParser'
import { IconX } from '@tabler/icons-react'

// API
import guardrailsApi from '@/api/guardrails'

// utils
import useNotifier from '@/utils/useNotifier'

/**
 * Guardrails v2 Phase 3 -- create-custom-definition form, following ToolDialog.jsx's pattern
 * (same Dialog/DialogTitle/DialogContent/DialogActions shape, same createPortal-to-#portal
 * convention, same manual snackbar-on-error style) since CustomTool authoring is the closest
 * existing precedent for this exact "workspace creates a reusable, DB-backed capability"
 * flow. Per migration-checklist.md rows 25-27, this whole feature area is logged
 * "not started" for the design-system pass and stays on plain MUI, matching what's already
 * shipped here (GuardrailRow.jsx, views/guardrails/index.jsx) -- not a Tailwind/shadcn rebuild.
 *
 * Only `kindKey:'regex_match'` is offered -- the only kind with a real generic executor
 * (see rules/guardrails-v2/phase3-authoring.md). The kind selector is still a real `Select`,
 * not hidden, so adding a second kind later is a one-line addition, not a rebuild.
 */
const CreateGuardrailDefinitionDialog = ({ show, onCancel, onConfirm }) => {
    const portalElement = document.getElementById('portal')
    const dispatch = useDispatch()
    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [name, setName] = useState('')
    const [key, setKey] = useState('')
    const [description, setDescription] = useState('')
    const [kindKey] = useState('regex_match')
    const [pattern, setPattern] = useState('')
    const [action, setAction] = useState('block')
    const [hooks, setHooks] = useState('pre')
    const [sampleInput, setSampleInput] = useState('')
    const [testResult, setTestResult] = useState(null)
    const [testing, setTesting] = useState(false)
    const [saving, setSaving] = useState(false)

    const keyValid = /^[a-z0-9_]+$/.test(key)
    const canSave = name.trim() && keyValid && pattern.trim() && !saving

    const showError = (message) => {
        enqueueSnackbar({
            message,
            options: {
                key: new Date().getTime() + Math.random(),
                variant: 'error',
                persist: true,
                action: (snackKey) => (
                    <Button style={{ color: 'white' }} onClick={() => closeSnackbar(snackKey)}>
                        <IconX />
                    </Button>
                )
            }
        })
    }

    const runTest = async () => {
        setTesting(true)
        setTestResult(null)
        try {
            const res = await guardrailsApi.dryRunDefinition({
                kindKey,
                defaultParams: { pattern, action },
                sampleInput
            })
            setTestResult(res.data)
        } catch (err) {
            showError(err?.response?.data?.message || 'Failed to test this guardrail')
        } finally {
            setTesting(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await guardrailsApi.createDefinition({
                name,
                key,
                description,
                kindKey,
                defaultParams: { pattern, action },
                hooks
            })
            enqueueSnackbar({
                message: 'Custom guardrail created',
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'success',
                    action: (snackKey) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(snackKey)}>
                            <IconX />
                        </Button>
                    )
                }
            })
            onConfirm(res.data)
        } catch (err) {
            showError(err?.response?.data?.message || 'Failed to create this guardrail')
        } finally {
            setSaving(false)
        }
    }

    const verdictColor = { pass: 'success', flag: 'warning', block: 'error', redact: 'info' }

    const component = show ? (
        <Dialog fullWidth maxWidth='sm' open={show} onClose={onCancel} aria-labelledby='create-guardrail-dialog-title'>
            <DialogTitle sx={{ fontSize: '1rem', p: 3, pb: 0 }} id='create-guardrail-dialog-title'>
                Create Custom Guardrail
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2, px: 3, pb: 3 }}>
                <Box>
                    <Typography variant='overline'>
                        Name<span style={{ color: 'red' }}>&nbsp;*</span>
                    </Typography>
                    <OutlinedInput fullWidth placeholder='Block SSNs' value={name} onChange={(e) => setName(e.target.value)} />
                </Box>
                <Box>
                    <Stack sx={{ position: 'relative', alignItems: 'center' }} direction='row'>
                        <Typography variant='overline'>
                            Key<span style={{ color: 'red' }}>&nbsp;*</span>
                        </Typography>
                        <TooltipWithParser title='Lowercase letters, numbers, and underscores only. Must be unique within this workspace.' />
                    </Stack>
                    <OutlinedInput
                        fullWidth
                        placeholder='block_ssns'
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        error={key.length > 0 && !keyValid}
                    />
                    {key.length > 0 && !keyValid && (
                        <Typography sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
                            Lowercase letters, numbers, and underscores only.
                        </Typography>
                    )}
                </Box>
                <Box>
                    <Typography variant='overline'>Description</Typography>
                    <OutlinedInput
                        fullWidth
                        multiline
                        rows={2}
                        placeholder='What this guardrail checks for'
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </Box>
                <Box>
                    <Stack sx={{ position: 'relative', alignItems: 'center' }} direction='row'>
                        <Typography variant='overline'>Kind</Typography>
                        <TooltipWithParser title='regex_match is the only kind with a real, generic executor today -- see rules/guardrails-v2/phase3-authoring.md' />
                    </Stack>
                    <Select fullWidth value={kindKey} disabled>
                        <MenuItem value='regex_match'>Regex Match</MenuItem>
                    </Select>
                </Box>
                <Box>
                    <Typography variant='overline'>
                        Pattern<span style={{ color: 'red' }}>&nbsp;*</span>
                    </Typography>
                    <OutlinedInput
                        fullWidth
                        placeholder='\\d{3}-\\d{2}-\\d{4}'
                        value={pattern}
                        onChange={(e) => setPattern(e.target.value)}
                    />
                </Box>
                <Stack direction='row' spacing={2}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant='overline'>Action on match</Typography>
                        <Select fullWidth value={action} onChange={(e) => setAction(e.target.value)}>
                            <MenuItem value='block'>Block</MenuItem>
                            <MenuItem value='flag'>Flag (observe only, never blocks or redacts)</MenuItem>
                            <MenuItem value='redact'>Redact</MenuItem>
                        </Select>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Stack sx={{ position: 'relative', alignItems: 'center' }} direction='row'>
                            <Typography variant='overline'>Checks</Typography>
                            <TooltipWithParser title="'pre' checks a tool call's outgoing arguments before it runs; 'post' checks the tool's result after it runs. Choose based on what you're trying to catch." />
                        </Stack>
                        <Select fullWidth value={hooks} onChange={(e) => setHooks(e.target.value)}>
                            <MenuItem value='pre'>Before the tool call (arguments)</MenuItem>
                            <MenuItem value='post'>After the tool call (result)</MenuItem>
                        </Select>
                    </Box>
                </Stack>

                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, mt: 1 }}>
                    <Typography variant='overline'>Test before saving</Typography>
                    <OutlinedInput
                        fullWidth
                        multiline
                        rows={2}
                        placeholder='Paste sample content to test this pattern against'
                        value={sampleInput}
                        onChange={(e) => setSampleInput(e.target.value)}
                        sx={{ mb: 1 }}
                    />
                    <Button variant='outlined' onClick={runTest} disabled={testing || !pattern.trim() || !sampleInput.trim()}>
                        {testing ? 'Testing...' : 'Test'}
                    </Button>
                    {testResult && (
                        <Box sx={{ mt: 1.5 }}>
                            <Chip
                                size='small'
                                label={testResult.verdict}
                                color={verdictColor[testResult.verdict] || 'default'}
                                sx={{ mr: 1 }}
                            />
                            {testResult.reason && (
                                <Typography component='span' sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                                    {testResult.reason}
                                </Typography>
                            )}
                            {testResult.transformedPayload && (
                                <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.5 }}>
                                    Result: {testResult.transformedPayload}
                                </Typography>
                            )}
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onCancel}>Cancel</Button>
                <StyledButton disabled={!canSave} variant='contained' onClick={handleSave}>
                    {saving ? 'Creating...' : 'Create'}
                </StyledButton>
            </DialogActions>
        </Dialog>
    ) : null

    return createPortal(component, portalElement)
}

CreateGuardrailDefinitionDialog.propTypes = {
    show: PropTypes.bool,
    onCancel: PropTypes.func,
    onConfirm: PropTypes.func
}

export default CreateGuardrailDefinitionDialog
