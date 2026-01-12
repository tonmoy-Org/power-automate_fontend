import React from 'react';
import { Box, Typography, Container, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function DashboardFooter() {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 2.5,
        px: 2,
        backgroundColor: theme.palette.mode === 'dark' 
          ? alpha(theme.palette.background.paper, 0.95) 
          : 'white',
      }}
    >
      <Container maxWidth="xl">
        <Typography
          variant="body2"
          align="center"
          sx={{
            fontWeight: 400,
            fontSize: '0.875rem',
            opacity: 0.8,
            color: theme.palette.text.primary,
          }}
        >
          © {currentYear} Finance Dashboard. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}