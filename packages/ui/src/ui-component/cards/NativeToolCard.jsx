import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'

// material-ui
import { styled } from '@mui/material/styles'
import { Box, Grid, Typography, useTheme } from '@mui/material'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import { NATIVE_TOOL_CONFIG_STATUS } from '@/store/constant'

const CardWrapper = styled(MainCard)(({ theme }) => ({
    background: theme.palette.card.main,
    color: theme.darkTextPrimary,
    overflow: 'auto',
    position: 'relative',
    boxShadow: '0 2px 14px 0 rgb(32 40 45 / 8%)',
    cursor: 'pointer',
    '&:hover': {
        background: theme.palette.card.hover,
        boxShadow: '0 2px 14px 0 rgb(32 40 45 / 20%)'
    },
    height: '100%',
    minHeight: '160px',
    maxHeight: '300px',
    width: '100%',
    overflowWrap: 'break-word',
    whiteSpace: 'pre-line'
}))

const getStatusColors = (status, isDarkMode, theme) => {
    switch (status) {
        case NATIVE_TOOL_CONFIG_STATUS.CONFIGURED:
            return isDarkMode ? ['#1b5e20', '#2e7d32', '#ffffff'] : ['#e8f5e9', '#81c784', '#43a047']
        case NATIVE_TOOL_CONFIG_STATUS.SETUP_REQUIRED:
            return isDarkMode ? ['#e65100', '#f57c00', '#ffffff'] : ['#fff3e0', '#ffb74d', '#e65100']
        case NATIVE_TOOL_CONFIG_STATUS.NO_SETUP_NEEDED:
        default:
            return isDarkMode
                ? [theme.palette.grey[800], theme.palette.grey[500], theme.palette.grey[200]]
                : [theme.palette.grey[100], theme.palette.grey[400], theme.palette.grey[700]]
    }
}

const STATUS_LABEL = {
    [NATIVE_TOOL_CONFIG_STATUS.CONFIGURED]: 'Configured',
    [NATIVE_TOOL_CONFIG_STATUS.SETUP_REQUIRED]: 'Setup Required',
    [NATIVE_TOOL_CONFIG_STATUS.NO_SETUP_NEEDED]: 'Ready'
}

// ===========================|| NATIVE TOOL CARD ||=========================== //

const NativeToolCard = ({ data, onClick }) => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    const isDarkMode = customization.isDarkMode

    const statusColors = getStatusColors(data.configStatus, isDarkMode, theme)

    return (
        <CardWrapper content={false} onClick={onClick} sx={{ border: 1, borderColor: theme.palette.grey[900] + 25, borderRadius: 2 }}>
            <Box sx={{ height: '100%', p: 2.25 }}>
                <Grid container justifyContent='space-between' direction='column' sx={{ height: '100%' }} gap={2}>
                    <Box display='flex' flexDirection='column' sx={{ flex: 1, width: '100%' }}>
                        <div
                            style={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                overflow: 'hidden'
                            }}
                        >
                            {data.iconSrc && (
                                <div
                                    style={{
                                        width: 35,
                                        height: 35,
                                        display: 'flex',
                                        flexShrink: 0,
                                        marginRight: 10,
                                        borderRadius: '50%',
                                        backgroundImage: `url(${data.iconSrc})`,
                                        backgroundSize: 'contain',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'center center'
                                    }}
                                />
                            )}
                            <Typography
                                sx={{
                                    display: '-webkit-box',
                                    fontSize: '1.1rem',
                                    fontWeight: 500,
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    flex: 1,
                                    mr: 1
                                }}
                            >
                                {data.label}
                            </Typography>
                        </div>

                        {data.description && (
                            <Typography
                                variant='body2'
                                sx={{
                                    mt: 1,
                                    color: theme.palette.text.secondary,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    fontSize: '0.8rem'
                                }}
                            >
                                {data.description}
                            </Typography>
                        )}
                    </Box>

                    <Grid container columnGap={1} rowGap={1} alignItems='center'>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                background: statusColors[0],
                                borderRadius: '25px',
                                paddingTop: '3px',
                                paddingBottom: '3px',
                                paddingLeft: '10px',
                                paddingRight: '10px'
                            }}
                        >
                            <div
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: statusColors[1],
                                    marginRight: 5
                                }}
                            />
                            <span style={{ fontSize: '0.65rem', color: statusColors[2], textTransform: 'uppercase' }}>
                                {STATUS_LABEL[data.configStatus]}
                            </span>
                        </div>
                    </Grid>
                </Grid>
            </Box>
        </CardWrapper>
    )
}

NativeToolCard.propTypes = {
    data: PropTypes.shape({
        name: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        description: PropTypes.string,
        iconSrc: PropTypes.string,
        configStatus: PropTypes.string
    }).isRequired,
    onClick: PropTypes.func
}

export default NativeToolCard
