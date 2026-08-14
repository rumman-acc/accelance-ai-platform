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
import workspaceApi from '@/api/workspace'

// utils
import useNotifier from '@/utils/useNotifier'
import { HIDE_CANVAS_DIALOG, SHOW_CANVAS_DIALOG } from '@/store/actions'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'

/**
 * Workspace-level override of the analytics-provider cascade — sits between the organization
 * defaults and each agent's own override. See mergeAnalyticsConfig on the server.
 */
const WorkspaceAnalyticsDialog = ({ show, dialogProps, onCancel, onConfirm }) => {
    const portalElement = document.getElementById('portal')
    const dispatch = useDispatch()

    useNotifier()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [analytic, setAnalytic] = useState({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (dialogProps.workspace && dialogProps.workspace.analytic) {
            try {
                setAnalytic(JSON.parse(dialogProps.workspace.analytic))
            } catch (e) {
                setAnalytic({})
                console.error(e)
            }
        } else {
            setAnalytic({})
        }

        return () => setAnalytic({})
    }, [dialogProps])

    useEffect(() => {
        if (show) dispatch({ type: SHOW_CANVAS_DIALOG })
        else dispatch({ type: HIDE_CANVAS_DIALOG })
        return () => dispatch({ type: HIDE_CANVAS_DIALOG })
    }, [show, dispatch])

    const onSave = async () => {
        setSaving(true)
        try {
            const saveResp = await workspaceApi.updateWorkspaceAnalytic(dialogProps.workspace.id, {
                analytic: JSON.stringify(analytic)
            })
            if (saveResp.data) {
                enqueueSnackbar({
                    message: 'Workspace Analytics Configuration Saved',
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'success',
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
                onConfirm(saveResp.data)
            }
        } catch (error) {
            enqueueSnackbar({
                message: `Failed to save Workspace Analytics Configuration: ${
                    typeof error.response?.data === 'object' ? error.response.data.message : error.response?.data
                }`,
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
        } finally {
            setSaving(false)
        }
    }

    const component = show ? (
        <Dialog fullWidth maxWidth='md' open={show} onClose={onCancel} aria-labelledby='workspace-analytics-dialog-title'>
            <DialogTitle sx={{ fontSize: '1rem' }} id='workspace-analytics-dialog-title'>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <IconChartBar style={{ marginRight: '10px' }} />
                    {'Analytics - '} {dialogProps.workspace?.name || ''}
                </div>
            </DialogTitle>
            <DialogContent>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                    Overrides the organization&apos;s analytics defaults for every agent in this workspace only. Turning a provider off here
                    still lets an individual agent turn it back on for itself.
                </Typography>
                <AnalyticsConfigForm value={analytic} onChange={setAnalytic} onSave={onSave} saving={saving} />
            </DialogContent>
        </Dialog>
    ) : null

    return createPortal(component, portalElement)
}

WorkspaceAnalyticsDialog.propTypes = {
    show: PropTypes.bool,
    dialogProps: PropTypes.object,
    onCancel: PropTypes.func,
    onConfirm: PropTypes.func
}

export default WorkspaceAnalyticsDialog
