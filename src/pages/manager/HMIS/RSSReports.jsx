import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const RSSReports = () => {
    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                RSS Reports
            </Typography>
            <Paper sx={{ p: 3 }}>
                <Typography variant="body1">
                    This is the RSS Reports page. Here you can view and manage RSS-related health department reports.
                </Typography>
            </Paper>
        </Box>
    );
};

export default RSSReports;