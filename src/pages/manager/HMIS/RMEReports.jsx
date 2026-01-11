import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const RMEReports = () => {
    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                RME Reports
            </Typography>
            <Paper sx={{ p: 3 }}>
                <Typography variant="body1">
                    This is the RME Reports page. Here you can view and manage RME-related health department reports.
                </Typography>
            </Paper>
        </Box>
    );
};

export default RMEReports;