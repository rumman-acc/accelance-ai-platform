import { memo, useState, useRef, useEffect, useContext } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { ClickAwayListener, Paper, Popper, Button } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { IconMessage, IconX, IconEraser } from '@tabler/icons-react'

// project import
import { StyledFab } from '@/ui-component/button/StyledFab'
import MainCard from '@/ui-component/cards/MainCard'
import Transitions from '@/ui-component/extended/Transitions'
import ChatMessage from './ChatMessage'
import ChatExpandDialog from './ChatExpandDialog'

// api
import chatmessageApi from '@/api/chatmessage'

// Hooks
import useConfirm from '@/hooks/useConfirm'
import useNotifier from '@/utils/useNotifier'
import { flowContext } from '@/store/context/ReactFlowContext'

// Const
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'

// Utils
import { getLocalStorageChatflow, removeLocalStorageChatHistory } from '@/utils/genericHelper'

const ChatPopUp = ({ chatflowid, isAgentCanvas, onOpenChange }) => {
    const theme = useTheme()
    const { confirm } = useConfirm()
    const dispatch = useDispatch()
    const { clearAgentflowNodeStatus } = useContext(flowContext)

    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    // ── Agent canvas: single resizable docked panel, no separate "expand" step ──
    // `everOpened` is sticky (false -> true only, never back) so ChatMessage
    // stays mounted — and its live SSE connection stays open — for the whole
    // life of this component, regardless of how many times the panel is
    // hidden/shown. `panelVisible` is the free-toggling show/hide.
    const [everOpened, setEverOpened] = useState(false)
    const [panelVisible, setPanelVisible] = useState(false)
    const [resetSignal, setResetSignal] = useState(0)
    const [previewsAgentCanvas, setPreviewsAgentCanvas] = useState([])

    const toggleAgentCanvasPanel = () => {
        const next = !panelVisible
        setPanelVisible(next)
        if (next) setEverOpened(true)
        if (onOpenChange) onOpenChange(next)
    }

    const clearChatAgentCanvas = async () => {
        const confirmPayload = {
            title: `Clear Chat History`,
            description: `Are you sure you want to clear all chat history?`,
            confirmButtonName: 'Clear',
            cancelButtonName: 'Cancel'
        }
        const isConfirmed = await confirm(confirmPayload)
        if (!isConfirmed) return

        try {
            const objChatDetails = getLocalStorageChatflow(chatflowid)
            if (!objChatDetails.chatId) return
            await chatmessageApi.deleteChatmessage(chatflowid, { chatId: objChatDetails.chatId, chatType: 'INTERNAL' })
            removeLocalStorageChatHistory(chatflowid)
            clearAgentflowNodeStatus()
            setResetSignal((prev) => prev + 1)
            enqueueSnackbar({
                message: 'Successfully cleared all chat history',
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
        } catch (error) {
            enqueueSnackbar({
                message: typeof error.response.data === 'object' ? error.response.data.message : error.response.data,
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
    }

    // ── Classic (non-agent) canvas: original small popover + on-demand dialog ──
    const [open, setOpen] = useState(false)
    const [showExpandDialog, setShowExpandDialog] = useState(false)
    const [expandDialogProps, setExpandDialogProps] = useState({})
    const [previews, setPreviews] = useState([])

    const anchorRef = useRef(null)
    const prevOpen = useRef(open)

    const handleClose = (event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) {
            return
        }
        setOpen(false)
        if (onOpenChange) onOpenChange(false)
    }

    const handleToggle = () => {
        const newOpenState = !open
        setOpen(newOpenState)
        if (onOpenChange) onOpenChange(newOpenState)
    }

    const expandChat = () => {
        const props = {
            open: true,
            chatflowid: chatflowid
        }
        setExpandDialogProps(props)
        setShowExpandDialog(true)
    }

    const resetChatDialog = () => {
        const props = {
            ...expandDialogProps,
            open: false
        }
        setExpandDialogProps(props)
        clearAgentflowNodeStatus()
        setTimeout(() => {
            const resetProps = {
                ...expandDialogProps,
                open: true
            }
            setExpandDialogProps(resetProps)
        }, 500)
    }

    const clearChat = async () => {
        const confirmPayload = {
            title: `Clear Chat History`,
            description: `Are you sure you want to clear all chat history?`,
            confirmButtonName: 'Clear',
            cancelButtonName: 'Cancel'
        }
        const isConfirmed = await confirm(confirmPayload)

        if (isConfirmed) {
            try {
                const objChatDetails = getLocalStorageChatflow(chatflowid)
                if (!objChatDetails.chatId) return
                await chatmessageApi.deleteChatmessage(chatflowid, { chatId: objChatDetails.chatId, chatType: 'INTERNAL' })
                removeLocalStorageChatHistory(chatflowid)
                resetChatDialog()
                enqueueSnackbar({
                    message: 'Successfully cleared all chat history',
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
            } catch (error) {
                enqueueSnackbar({
                    message: typeof error.response.data === 'object' ? error.response.data.message : error.response.data,
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
        }
    }

    useEffect(() => {
        if (prevOpen.current === true && open === false) {
            anchorRef.current.focus()
            if (onOpenChange) onOpenChange(false)
        }
        prevOpen.current = open

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, chatflowid])

    if (isAgentCanvas) {
        return (
            <>
                <StyledFab
                    sx={{ position: 'absolute', right: 20, top: 20 }}
                    ref={anchorRef}
                    size='small'
                    color='primary'
                    aria-label='chat'
                    title='Chat'
                    onClick={toggleAgentCanvasPanel}
                >
                    {panelVisible ? <IconX /> : <IconMessage />}
                </StyledFab>
                <ChatExpandDialog
                    mounted={everOpened}
                    visible={panelVisible}
                    dialogProps={{ open: true, chatflowid, title: 'Chat' }}
                    isAgentCanvas={isAgentCanvas}
                    onClear={clearChatAgentCanvas}
                    onCancel={toggleAgentCanvasPanel}
                    previews={previewsAgentCanvas}
                    setPreviews={setPreviewsAgentCanvas}
                    resetSignal={resetSignal}
                />
            </>
        )
    }

    return (
        <>
            <StyledFab
                sx={{ position: 'absolute', right: 20, top: 20 }}
                ref={anchorRef}
                size='small'
                color='primary'
                aria-label='chat'
                title='Chat'
                onClick={handleToggle}
            >
                {open ? <IconX /> : <IconMessage />}
            </StyledFab>

            {open && (
                <StyledFab
                    sx={{ position: 'absolute', right: 80, top: 20 }}
                    onClick={clearChat}
                    size='small'
                    color='error'
                    aria-label='clear'
                    title='Clear Chat History'
                >
                    <IconEraser />
                </StyledFab>
            )}
            {open && (
                <StyledFab
                    sx={{ position: 'absolute', right: 140, top: 20 }}
                    onClick={expandChat}
                    size='small'
                    color='primary'
                    aria-label='expand'
                    title='Expand Chat'
                >
                    <IconMessage />
                </StyledFab>
            )}
            <Popper
                placement='bottom-end'
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                transition
                disablePortal
                popperOptions={{
                    modifiers: [
                        {
                            name: 'offset',
                            options: {
                                offset: [40, 14]
                            }
                        }
                    ]
                }}
                sx={{ zIndex: 1000 }}
            >
                {({ TransitionProps }) => (
                    <Transitions in={open} {...TransitionProps}>
                        <Paper>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MainCard
                                    border={false}
                                    className='cloud-wrapper'
                                    elevation={16}
                                    content={false}
                                    boxShadow
                                    shadow={theme.shadows[16]}
                                >
                                    <ChatMessage
                                        isAgentCanvas={isAgentCanvas}
                                        chatflowid={chatflowid}
                                        open={open}
                                        previews={previews}
                                        setPreviews={setPreviews}
                                    />
                                </MainCard>
                            </ClickAwayListener>
                        </Paper>
                    </Transitions>
                )}
            </Popper>
            <ChatExpandDialog
                mounted={showExpandDialog}
                visible={showExpandDialog && expandDialogProps.open !== false}
                dialogProps={expandDialogProps}
                isAgentCanvas={isAgentCanvas}
                onClear={clearChat}
                onCancel={() => setShowExpandDialog(false)}
                previews={previews}
                setPreviews={setPreviews}
            ></ChatExpandDialog>
        </>
    )
}

ChatPopUp.propTypes = {
    chatflowid: PropTypes.string,
    isAgentCanvas: PropTypes.bool,
    onOpenChange: PropTypes.func
}

export default memo(ChatPopUp)
