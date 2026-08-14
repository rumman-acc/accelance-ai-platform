import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'

// Material
import { Button, Dialog, DialogContent, DialogTitle, Typography } from '@mui/material'

// Project imports
import AnalyticsConfigForm from '@/ui-component/extended/AnalyticsConfigForm'

// Icons
import { IconX, IconChartBar } from '@tabler/icons-react'

// API
import chatflowsApi from '@/api/chatflows'

// utils
import useNotifier from '@/utils/useNotifier'
import { HIDE_CANVAS_DIALOG, SHOW_CANVAS_DIALOG } from '@/store/actions'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'

/**
 * Applies one analytics-provider config to every selected agent at once, fanning out an
 * individual PATCH per chatflow (same convention as WorkspaceUsers.jsx's bulk user removal) —
 * this overwrites each selected agent's own analytic override, it does not merge with whatever
 * it already had, since selected agents may currently disagree with each other.
 */
const BulkAnalyticsDialog = ({ show, dialogProps, onCancel, onConfirm }) => {
    const portalElement = document.getElementById('portal')
    const dispatch = useDispatch()

    useNotifier()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [analytic, setAnalytic] = useState({})
    const [saving, setSaving] = useState(false)

    const chatflowIds = dialogProps?.chatflowIds || []

    useEffect(() => {
        if (show) dispatch({ type: SHOW_CANVAS_DIALOG })
        else dispatch({ type: HIDE_CANVAS_DIALOG })
        return () => dispatch({ type: HIDE_CANVAS_DIALOG })
    }, [show, dispatch])

    const onSave = async () => {
        setSaving(true)
        try {
            const body = { analytic: JSON.stringify(analytic) }
            const results = await Promise.allSettled(chatflowIds.map((id) => chatflowsApi.updateChatflow(id, body)))
            const succeeded = results.filter((r) => r.status === 'fulfilled').length
            const failed = results.length - succeeded

            if (succeeded > 0) {
                enqueueSnackbar({
                    message: `Analytics Configuration applied to ${succeeded} agent(s)${failed > 0 ? `, ${failed} failed` : ''}.`,
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: failed > 0 ? 'warning' : 'success',
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
            } else {
                enqueueSnackbar({
                    message: 'Failed to apply Analytics Configuration to any of the selected agents.',
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'error',
                        persist: true,
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
            }
            onConfirm(succeeded)
        } finally {
            setSaving(false)
        }
    }

    const component = show ? (
        <Dialog fullWidth maxWidth='md' open={show} onClose={onCancel} aria-labelledby='bulk-analytics-dialog-title'>
            <DialogTitle sx={{ fontSize: '1rem' }} id='bulk-analytics-dialog-title'>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <IconChartBar style={{ marginRight: '10px' }} />
                    {`Configure Analytics - ${chatflowIds.length} Agent(s) Selected`}
                </div>
            </DialogTitle>
            <DialogContent>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                    This overwrites the analytics configuration on all {chatflowIds.length} selected agent(s) — it replaces whatever each
                    one currently has, it does not merge with it.
                </Typography>
                <AnalyticsConfigForm
                    value={analytic}
                    onChange={setAnalytic}
                    onSave={onSave}
                    saveLabel='Apply to Selected'
                    saving={saving}
                />
            </DialogContent>
        </Dialog>
    ) : null

    return createPortal(component, portalElement)
}

BulkAnalyticsDialog.propTypes = {
    show: PropTypes.bool,
    dialogProps: PropTypes.object,
    onCancel: PropTypes.func,
    onConfirm: PropTypes.func
}

export default BulkAnalyticsDialog
