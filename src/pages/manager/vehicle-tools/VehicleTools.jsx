import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import VehicleList from './VehicleList';
import VehicleIssues from './VehicleIssues';
import { alpha } from '@mui/material/styles';

const BLUE_COLOR = '#76AADA';
const BLUE_DARK = '#5A8FC8';

export const VehicleTools = () => {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <Box>
            <Helmet>
                <title>Vehicle & Tools Management | Sterling Septic & Plumbing LLC</title>
                <meta name="description" content="Manage vehicles, track status, and handle maintenance issues" />
            </Helmet>
            
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography sx={{
                        fontWeight: 'bold',
                        mb: 0.5,
                        fontSize: 20,
                        background: `linear-gradient(135deg, ${BLUE_DARK} 0%, ${BLUE_COLOR} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}>
                        Vehicle & Tools Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Track trucks, manage maintenance, and assign resources
                    </Typography>
                </Box>
            </Box>

            <Paper 
                elevation={0}
                sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha('#000', 0.08)}`,
                    mb: 3,
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    sx={{
                        minHeight: 48,
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            minHeight: 48,
                            '&.Mui-selected': {
                                color: BLUE_DARK,
                            },
                        },
                        '& .MuiTabs-indicator': {
                            backgroundColor: BLUE_DARK,
                        },
                    }}
                >
                    <Tab label="All Vehicles" />
                    <Tab label="Active Issues" />
                    <Tab label="Maintenance" />
                </Tabs>
            </Paper>

            {activeTab === 0 && <VehicleList />}
            {activeTab === 1 && <VehicleIssues />}
            {activeTab === 2 && (
                <Box p={3} textAlign="center">
                    <Typography color="text.secondary">
                        Maintenance reports coming soon...
                    </Typography>
                </Box>
            )}
        </Box>
    );
};