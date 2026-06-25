import logo from '@/assets/images/accelance_white.svg'
import logoDark from '@/assets/images/accelance_dark.svg'

import { useSelector } from 'react-redux'

// ==============================|| LOGO ||============================== //

const Logo = () => {
    const customization = useSelector((state) => state.customization)

    return (
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row', marginLeft: '10px' }}>
            <img
                style={{ objectFit: 'contain', height: 'auto', width: 121 }}
                src={customization.isDarkMode ? logoDark : logo}
                alt='Accelance'
            />
        </div>
    )
}

export default Logo
