import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'

// material-ui
import { useTheme } from '@mui/material/styles'
import { Avatar, Box, ButtonBase, Typography, Stack } from '@mui/material'
import { StyledButton } from '@/ui-component/button/StyledButton'

// icons
import { IconCopy, IconChevronLeft } from '@tabler/icons-react'
import { Available } from '@/ui-component/rbac/available'

// ==============================|| CANVAS HEADER ||============================== //

const MarketplaceCanvasHeader = ({ flowName, flowData, onChatflowCopy }) => {
    const theme = useTheme()
    const navigate = useNavigate()

    return (
        <>
            <Box>
                <ButtonBase title='Back' sx={{ borderRadius: '50%' }}>
                    <Avatar
                        variant='rounded'
                        sx={{
                            ...theme.typography.commonAvatar,
                            ...theme.typography.mediumAvatar,
                            transition: 'all .2s ease-in-out',
                            background: theme.palette.primary.light,
                            color: theme.palette.primary.dark,
                            '&:hover': {
                                background: theme.palette.primary.main,
                                color: theme.palette.primary.light
                            }
                        }}
                        color='inherit'
                        onClick={() => navigate(-1)}
                    >
                        <IconChevronLeft stroke={1.5} size='1.3rem' />
                    </Avatar>
                </ButtonBase>
            </Box>
            <Box sx={{ flexGrow: 1 }}>
                <Stack flexDirection='row'>
                    <Typography
                        sx={{
                            fontSize: '1.5rem',
                            fontWeight: 600,
                            ml: 2
                        }}
                    >
                        {flowName}
                    </Typography>
                </Stack>
            </Box>
            <Available permission={'chatflows:create,agentflows.create'}>
                <Box>
                    <StyledButton
                        color='primary'
                        variant='contained'
                        title='Use Chatflow'
                        onClick={() => onChatflowCopy(flowData)}
                        startIcon={<IconCopy />}
                    >
                        Use Template
                    </StyledButton>
                </Box>
            </Available>
        </>
    )
}

MarketplaceCanvasHeader.propTypes = {
    flowName: PropTypes.string,
    flowData: PropTypes.object,
    onChatflowCopy: PropTypes.func
}

export default MarketplaceCanvasHeader
