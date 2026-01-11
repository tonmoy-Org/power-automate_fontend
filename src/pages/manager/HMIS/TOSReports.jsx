import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const TOSReports = () => {
    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                TOS Reports
            </Typography>
            <Paper sx={{ p: 3 }}>
                <Typography variant="body1">
                    This is the TOS Reports page. Here you can view and manage TOS-related health department reports.
                </Typography>
            </Paper>
        </Box>
    );
};

export default TOSReports;