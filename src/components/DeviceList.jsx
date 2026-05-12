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
    useTheme,
} from '@mui/material';
import {
    Laptop as LaptopIcon,
    PhoneAndroid as PhoneIcon,
    Tablet as TabletIcon,
    Computer as ComputerIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

const DeviceList = ({ devices = [] }) => {
    const theme = useTheme();

    // Use theme colors
    const BLUE_COLOR = theme.palette.primary.main;
    const BLUE_DARK = theme.palette.primary.dark || theme.palette.primary.main;
    const GREEN_COLOR = theme.palette.success.main;
    const GREEN_DARK = theme.palette.success.dark || theme.palette.success.main;
    const TEXT_PRIMARY = theme.palette.text.primary;

    const getDeviceIcon = (deviceType) => {
        const type = deviceType?.toLowerCase();
        if (type === 'mobile') return <PhoneIcon sx={{ color: BLUE_COLOR, fontSize: '0.9rem' }} />;
        if (type === 'tablet') return <TabletIcon sx={{ color: BLUE_COLOR, fontSize: '0.9rem' }} />;
        if (type === 'laptop') return <LaptopIcon sx={{ color: BLUE_COLOR, fontSize: '0.9rem' }} />;
        return <ComputerIcon sx={{ color: BLUE_COLOR, fontSize: '0.9rem' }} />;
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
                elevation={0}
                sx={{
                    p: 2,
                    borderRadius: 1.5,
                    textAlign: 'center',
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.mode === 'dark'
                        ? alpha(BLUE_COLOR, 0.05)
                        : alpha(BLUE_COLOR, 0.02),
                }}
            >
                <Typography variant="caption" color={TEXT_PRIMARY} sx={{ fontSize: '0.75rem' }}>
                    No active devices found
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper
            elevation={0}
            sx={{
                p: 1.5,
                borderRadius: 1.5,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
            }}
        >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    color={TEXT_PRIMARY}
                    sx={{ fontSize: '0.85rem' }}
                >
                    Active Devices
                </Typography>
                <Chip
                    label={`${devices.length} ${devices.length === 1 ? 'Device' : 'Devices'}`}
                    size="small"
                    sx={{
                        backgroundColor: theme.palette.mode === 'dark'
                            ? alpha(BLUE_COLOR, 0.2)
                            : alpha(BLUE_COLOR, 0.1),
                        color: BLUE_COLOR,
                        borderColor: BLUE_COLOR,
                        fontWeight: 500,
                        fontSize: '0.7rem',
                        height: 22,
                        '& .MuiChip-label': {
                            px: 1,
                            py: 0.25,
                        },
                    }}
                    variant="outlined"
                />
            </Box>

            <List sx={{ p: 0 }}>
                {devices.map((device, index) => (
                    <React.Fragment key={device.deviceId || index}>
                        <ListItem
                            sx={{
                                px: 1.5,
                                py: 1,
                                borderRadius: 1,
                                '&:hover': {
                                    backgroundColor: theme.palette.mode === 'dark'
                                        ? alpha(BLUE_COLOR, 0.08)
                                        : alpha(BLUE_COLOR, 0.03),
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                                {getDeviceIcon(device.deviceType)}
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Box display="flex" alignItems="center" gap={0.75}>
                                        <Typography variant="caption" fontWeight={600} color={TEXT_PRIMARY} sx={{ fontSize: '0.8rem' }}>
                                            {device.deviceType || 'Desktop'}
                                        </Typography>
                                        {index === 0 && (
                                            <Chip
                                                icon={<CheckCircleIcon sx={{ fontSize: '0.7rem' }} />}
                                                label="Current"
                                                size="small"
                                                sx={{
                                                    height: 18,
                                                    backgroundColor: theme.palette.mode === 'dark'
                                                        ? alpha(GREEN_COLOR, 0.2)
                                                        : alpha(GREEN_COLOR, 0.1),
                                                    color: GREEN_COLOR,
                                                    borderColor: GREEN_COLOR,
                                                    fontWeight: 500,
                                                    fontSize: '0.65rem',
                                                    '& .MuiChip-icon': {
                                                        color: GREEN_COLOR,
                                                        fontSize: '0.65rem',
                                                        ml: 0.5,
                                                    },
                                                    '& .MuiChip-label': {
                                                        px: 0.75,
                                                        py: 0,
                                                    },
                                                }}
                                                variant="outlined"
                                            />
                                        )}
                                    </Box>
                                }
                                secondary={
                                    <Box sx={{ mt: 0.25 }}>
                                        <Typography display="block" color={TEXT_PRIMARY} sx={{ fontSize: '0.75rem' }}>
                                            {device.browser} {device.browserVersion && `v${device.browserVersion}`} • {device.os} {device.osVersion}
                                        </Typography>
                                        <Typography display="block" color={TEXT_PRIMARY} sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
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
                                    backgroundColor: theme.palette.divider,
                                    margin: '2px 0',
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