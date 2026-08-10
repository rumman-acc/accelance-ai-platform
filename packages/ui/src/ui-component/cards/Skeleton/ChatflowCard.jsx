// material-ui
import { Box, Card, CardContent, CircularProgress } from '@mui/material'

// ==============================|| SKELETON - BRIDGE CARD ||============================== //

const ChatflowCard = () => (
    <Card sx={{ height: 270 }}>
        <CardContent sx={{ height: '100%' }}>
            <Box display='flex' alignItems='center' justifyContent='center' sx={{ height: '100%' }}>
                <CircularProgress />
            </Box>
        </CardContent>
    </Card>
)

export default ChatflowCard
