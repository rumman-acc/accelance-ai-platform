import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'

import { Drawer, IconButton, Tooltip } from '@mui/material'
import ChatMessage from './ChatMessage'
import { IconEraser, IconX } from '@tabler/icons-react'

const DEFAULT_DOCK_WIDTH = 420
const MIN_DOCK_WIDTH = 320
const MAX_DOCK_WIDTH = 960
const DOCK_WIDTH_STORAGE_KEY = 'chatDockWidth'
const RESIZE_KEY_STEP = 20

// A single resizable side panel — no separate "expanded" mode to toggle
// between. `mounted` is sticky: once true it stays true for the lifetime of
// this component instance, so `ChatMessage` (and the live SSE connection an
// in-progress or paused agent run depends on) is never torn down just
// because the panel is visually hidden. `visible` is the actual show/hide
// toggle and is free to flip back and forth — it only controls the
// Drawer's slide-in/out, not whether anything underneath exists.
const ChatExpandDialog = ({ mounted, visible, dialogProps, isAgentCanvas, onClear, onCancel, previews, setPreviews, resetSignal }) => {
    const portalElement = document.getElementById('portal')
    const customization = useSelector((state) => state.customization)

    const [dockWidth, setDockWidth] = useState(() => {
        const saved = Number(window.localStorage.getItem(DOCK_WIDTH_STORAGE_KEY))
        return saved >= MIN_DOCK_WIDTH && saved <= MAX_DOCK_WIDTH ? saved : DEFAULT_DOCK_WIDTH
    })
    const isResizingRef = useRef(false)

    const handleResizeMouseDown = useCallback((e) => {
        e.preventDefault()
        isResizingRef.current = true
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
    }, [])

    const handleResizeKeyDown = useCallback((e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
        e.preventDefault()
        // Anchored right: ArrowLeft grows the panel, ArrowRight shrinks it
        const delta = e.key === 'ArrowLeft' ? RESIZE_KEY_STEP : -RESIZE_KEY_STEP
        setDockWidth((current) => {
            const next = Math.min(MAX_DOCK_WIDTH, Math.max(MIN_DOCK_WIDTH, current + delta))
            window.localStorage.setItem(DOCK_WIDTH_STORAGE_KEY, String(next))
            return next
        })
    }, [])

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizingRef.current) return
            // Anchored right: dragging left (smaller clientX) grows the panel
            const newWidth = window.innerWidth - e.clientX
            setDockWidth(Math.min(MAX_DOCK_WIDTH, Math.max(MIN_DOCK_WIDTH, newWidth)))
        }
        const handleMouseUp = () => {
            if (!isResizingRef.current) return
            isResizingRef.current = false
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
            setDockWidth((current) => {
                window.localStorage.setItem(DOCK_WIDTH_STORAGE_KEY, String(current))
                return current
            })
        }
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [])

    if (!mounted) {
        return null
    }

    const component = (
        <Drawer
            anchor='right'
            variant='temporary'
            open={visible}
            hideBackdrop
            disableEnforceFocus
            disableScrollLock
            ModalProps={{ keepMounted: true }}
            PaperProps={{ sx: { width: dockWidth, display: 'flex', flexDirection: 'column', overflow: 'visible' } }}
            sx={{ '& .MuiModal-root': { pointerEvents: 'none' }, '& .MuiDrawer-paper': { pointerEvents: 'auto' } }}
        >
            {/* Drag handle on the left edge — anchor="right" means dragging left grows the panel.
                This is WAI-ARIA's "focusable separator" pattern (a resizable-splitter affordance);
                eslint-plugin-jsx-a11y's role map doesn't recognize role="separator" as interactive
                even when focusable, so its no-noninteractive-* rules false-positive here. */}
            {/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
            <div
                role='separator'
                aria-orientation='vertical'
                aria-label='Resize chat panel'
                aria-valuenow={dockWidth}
                aria-valuemin={MIN_DOCK_WIDTH}
                aria-valuemax={MAX_DOCK_WIDTH}
                tabIndex={0}
                onMouseDown={handleResizeMouseDown}
                onKeyDown={handleResizeKeyDown}
                title='Drag to resize (or use arrow keys when focused)'
                style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: -4,
                    width: 8,
                    cursor: 'col-resize',
                    zIndex: 1
                }}
            />
            {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
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
                <Tooltip title='Close'>
                    <IconButton size='small' onClick={onCancel}>
                        <IconX size={18} />
                    </IconButton>
                </Tooltip>
            </div>
            <div className='cloud-dialog-wrapper' style={{ width: '100%', height: 'calc(100vh - 53px)' }}>
                {/* `open` fixed at true for the life of this mount — this is what the
                    chat history fetch-on-open effect keys off; it must not flip when
                    the panel is only being visually hidden, or an in-progress/paused
                    execution's live connection gets torn down along with it. */}
                <ChatMessage
                    isDialog={true}
                    open={true}
                    isAgentCanvas={isAgentCanvas}
                    chatflowid={dialogProps.chatflowid}
                    previews={previews}
                    setPreviews={setPreviews}
                    resetSignal={resetSignal}
                />
            </div>
        </Drawer>
    )

    return createPortal(component, portalElement)
}

// Border color fallback matching this app's existing dark/light theme divider convention
function theme_borderColor(customization) {
    return customization?.isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
}

ChatExpandDialog.propTypes = {
    mounted: PropTypes.bool,
    visible: PropTypes.bool,
    dialogProps: PropTypes.object,
    isAgentCanvas: PropTypes.bool,
    onClear: PropTypes.func,
    onCancel: PropTypes.func,
    previews: PropTypes.array,
    setPreviews: PropTypes.func,
    resetSignal: PropTypes.number
}

export default ChatExpandDialog
