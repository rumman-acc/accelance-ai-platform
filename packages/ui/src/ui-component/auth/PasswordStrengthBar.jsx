import PropTypes from 'prop-types'
import { Box } from '@mui/material'

// ==============================|| PASSWORD STRENGTH BAR ||============================== //
// Purely visual feedback echoing the same criteria as utils/validation.js's passwordSchema
// (8+ chars, upper, lower, digit, symbol) — does not replace or duplicate the actual zod
// validation, just gives the user a live read on it before they submit.

export const getPasswordStrength = (password) => {
    if (!password) return 0
    let score = 0
    if (password.length >= 8) score += 1
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
    if (/\d/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    return score
}

const PasswordStrengthBar = ({ password }) => {
    const strength = getPasswordStrength(password)

    return (
        <Box sx={{ display: 'flex', gap: 0.75, pt: 0.25 }}>
            {[0, 1, 2, 3].map((i) => (
                <Box
                    key={i}
                    sx={{
                        height: '3px',
                        flex: 1,
                        borderRadius: '2px',
                        backgroundColor: (theme) => (i < strength ? theme.palette.primary.main : theme.palette.grey[300])
                    }}
                />
            ))}
        </Box>
    )
}

PasswordStrengthBar.propTypes = {
    password: PropTypes.string
}

export default PasswordStrengthBar
