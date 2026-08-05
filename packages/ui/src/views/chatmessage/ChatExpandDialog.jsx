import { useState } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'

import { Dialog, DialogContent, DialogTitle, Drawer, Button, IconButton, Tooltip } from '@mui/material'
import ChatMessage from './ChatMessage'
import { StyledButton } from '@/ui-component/button/StyledButton'
import { IconEraser, IconLayoutSidebarRightExpand, IconArrowsMaximize, IconX } from '@tabler/icons-react'

const DOCK_WIDTH = 420

const ChatExpandDialog = ({ show, dialogProps, isAgentCanvas, onClear, onCancel, previews, setPreviews }) => {
    const portalElement = document.getElementById('portal')
    const customization = useSelector((state) => state.customization)
    // Docking swaps the surrounding container (Dialog <-> Drawer) but keeps
    // `show`/`open` true the whole time — minimizing to the side is not the
    // same as closing, so the running conversation keeps streaming and the
    // panel just repositions rather than tearing down and losing progress.
    const [docked, setDocked] = useState(false)

    const clearChatButton = customization.isDarkMode ? (
        <StyledButton variant='outlined' color='error' title='Clear Conversation' onClick={onClear} startIcon={<IconEraser />}>
            Clear Chat
        </StyledButton>
    ) : (
        <Button variant='outlined' color='error' title='Clear Conversation' onClick={onClear} startIcon={<IconEraser />}>
            Clear Chat
        </Button>
    )

    const chatMessageEl = (
        <ChatMessage
            isDialog={true}
            open={dialogProps.open}
            isAgentCanvas={isAgentCanvas}
            chatflowid={dialogProps.chatflowid}
            previews={previews}
            setPreviews={setPreviews}
        />
    )

    if (!show) {
        return null
    }

    const component = docked ? (
        <Drawer
            anchor='right'
            variant='temporary'
            open={show}
            hideBackdrop
            disableEnforceFocus
            disableScrollLock
            ModalProps={{ keepMounted: true }}
            PaperProps={{ sx: { width: DOCK_WIDTH, display: 'flex', flexDirection: 'column' } }}
            sx={{ '& .MuiModal-root': { pointerEvents: 'none' }, '& .MuiDrawer-paper': { pointerEvents: 'auto' } }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    borderBottom: `1px solid ${theme_borderColor(customization)}`,
                    fontSize: '1rem'
                }}
            >
                <span style={{ flex: 1, fontWeight: 500 }}>{dialogProps.title}</span>
                <Tooltip title='Clear Conversation'>
                    <IconButton size='small' onClick={onClear}>
                        <IconEraser size={18} />
                    </IconButton>
                </Tooltip>
                <Tooltip title='Expand'>
                    <IconButton size='small' onClick={() => setDocked(false)}>
                        <IconArrowsMaximize size={18} />
                    </IconButton>
                </Tooltip>
                <Tooltip title='Close'>
                    <IconButton size='small' onClick={onCancel}>
                        <IconX size={18} />
                    </IconButton>
                </Tooltip>
            </div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{chatMessageEl}</div>
        </Drawer>
    ) : (
        <Dialog
            open={show}
            fullWidth
            maxWidth='md'
            onClose={onCancel}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
            sx={{ overflow: 'visible' }}
        >
            <DialogTitle sx={{ fontSize: '1rem', p: 1.5 }} id='alert-dialog-title'>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    {dialogProps.title}
                    <div style={{ flex: 1 }}></div>
                    <Tooltip title='Minimize to side'>
                        <IconButton size='small' onClick={() => setDocked(true)} sx={{ mr: 1 }}>
                            <IconLayoutSidebarRightExpand size={20} />
                        </IconButton>
                    </Tooltip>
                    {clearChatButton}
                </div>
            </DialogTitle>
            <DialogContent
                className='cloud-dialog-wrapper'
                sx={{ display: 'flex', justifyContent: 'flex-end', flexDirection: 'column', p: 0 }}
            >
                {chatMessageEl}
            </DialogContent>
        </Dialog>
    )

    return createPortal(component, portalElement)
}

// Border color fallback matching this app's existing dark/light theme divider convention
function theme_borderColor(customization) {
    return customization?.isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
}

ChatExpandDialog.propTypes = {
    show: PropTypes.bool,
    dialogProps: PropTypes.object,
    isAgentCanvas: PropTypes.bool,
    onClear: PropTypes.func,
    onCancel: PropTypes.func,
    previews: PropTypes.array,
    setPreviews: PropTypes.func
}

export default ChatExpandDialog
