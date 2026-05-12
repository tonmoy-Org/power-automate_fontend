import { Button, styled } from '@mui/material';

const OutlineButton = styled(Button)(({ theme }) => ({
    border: `1px solid #dc2626`,
    color: '#dc2626',
    borderRadius: '8px',
    padding: '4px 20px',
    fontWeight: 500,
    fontSize: '0.9rem',
    textTransform: 'none',
    transition: 'all 0.3s ease',
    '&:hover': {
        backgroundColor: 'rgba(220, 38, 38, 0.05)',
        borderColor: '#b91c1c',
        color: '#b91c1c',
        transform: 'translateY(-1px)',
    },
}));

export default OutlineButton;