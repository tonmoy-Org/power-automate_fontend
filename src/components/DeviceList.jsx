import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    alpha,
} from '@mui/material';
import {
    Laptop as LaptopIcon,
    PhoneAndroid as PhoneIcon,
    Tablet as TabletIcon,
    Computer as ComputerIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

// Define color constants
const BLUE_LIGHT = '#A8C9E9';
const BLUE_COLOR = '#1976d2';
const BLUE_DARK = '#1565c0';
const GREEN_COLOR = '#10b981';
const GREEN_LIGHT = '#a7f3d0';
const GREEN_DARK = '#059669';

const DeviceList = ({ devices = [] }) => {
    const getDeviceIcon = (deviceType) => {
        const type = deviceType?.toLowerCase();
        if (type === 'mobile') return <PhoneIcon sx={{ color: BLUE_COLOR }} />;
        if (type === 'tablet') return <TabletIcon sx={{ color: BLUE_COLOR }} />;
        if (type === 'laptop') return <LaptopIcon sx={{ color: BLUE_COLOR }} />;
        return <ComputerIcon sx={{ color: BLUE_COLOR }} />;
    };

    const formatDate = (date) => {
        if (!date) return 'Unknown';
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!devices || devices.length === 0) {
        return (
            <Paper
                elevation={1}
                sx={{
                    p: 3,
                    borderRadius: 2,
                    textAlign: 'center',
                    border: `1px solid ${alpha('#000', 0.08)}`,
                    backgroundColor: alpha(BLUE_COLOR, 0.02),
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    No active devices found
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper
            elevation={1}
            sx={{
                p: 2,
                borderRadius: 2,
                border: `1px solid ${alpha('#000', 0.08)}`,
            }}
        >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography 
                    variant="h6" 
                    fontWeight="bold"
                    color={BLUE_DARK}
                >
                    Active Devices
                </Typography>
                <Chip
                    label={`${devices.length} ${devices.length === 1 ? 'Device' : 'Devices'}`}
                    size="small"
                    sx={{
                        backgroundColor: alpha(BLUE_COLOR, 0.1),
                        color: BLUE_DARK,
                        borderColor: BLUE_COLOR,
                        fontWeight: 500,
                    }}
                    variant="outlined"
                />
            </Box>

            <List sx={{ p: 0 }}>
                {devices.map((device, index) => (
                    <React.Fragment key={device.deviceId || index}>
                        <ListItem
                            sx={{
                                px: 2,
                                py: 1.5,
                                borderRadius: 1,
                                '&:hover': {
                                    backgroundColor: alpha(BLUE_COLOR, 0.03),
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                {getDeviceIcon(device.deviceType)}
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography variant="body2" fontWeight="medium">
                                            {device.deviceType || 'Desktop'}
                                        </Typography>
                                        {index === 0 && (
                                            <Chip
                                                icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                                                label="Current"
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    backgroundColor: alpha(GREEN_COLOR, 0.1),
                                                    color: GREEN_DARK,
                                                    borderColor: GREEN_COLOR,
                                                    fontWeight: 500,
                                                    '& .MuiChip-icon': {
                                                        color: GREEN_COLOR,
                                                    },
                                                }}
                                                variant="outlined"
                                            />
                                        )}
                                    </Box>
                                }
                                secondary={
                                    <Box sx={{ mt: 0.5 }}>
                                        <Typography variant="caption" display="block" color="text.secondary">
                                            {device.browser} {device.browserVersion && `v${device.browserVersion}`} • {device.os} {device.osVersion}
                                        </Typography>
                                        <Typography variant="caption" display="block" color="text.secondary">
                                            Last active: {formatDate(device.lastActive || device.date)}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </ListItem>
                        {index < devices.length - 1 && (
                            <Divider 
                                component="li" 
                                sx={{ 
                                    backgroundColor: alpha(BLUE_COLOR, 0.1),
                                    margin: '4px 0',
                                }} 
                            />
                        )}
                    </React.Fragment>
                ))}
            </List>
        </Paper>
    );
};

export default DeviceList;