import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Button,
    InputAdornment,
    Tooltip,
    Avatar,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    CircularProgress,
    Badge,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    Search as SearchIcon,
    LocalShipping as TruckIcon,
    Build as ToolsIcon,
    CheckCircle as AvailableIcon,
    DirectionsCar as InUseIcon,
    BuildCircle as MaintenanceIcon,
    Block as OutOfServiceIcon,
    Person as PersonIcon,
    Warning as WarningIcon,
    Refresh as RefreshIcon,
    Report as ReportIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import GradientButton from '../../../components/ui/GradientButton';
import OutlineButton from '../../../components/ui/OutlineButton';
import StyledTextField from '../../../components/ui/StyledTextField';
import VehicleForm from './VehicleForm';
import VehicleDetails from './VehicleDetails';
import { alpha } from '@mui/material/styles';
import axiosInstance from '../../../api/axios';
import { CheckIcon, InfoIcon } from 'lucide-react';

const BLUE_COLOR = '#76AADA';
const BLUE_LIGHT = '#A8C9E9';
const BLUE_DARK = '#5A8FC8';
const GREEN_COLOR = '#10b981';
const GREEN_DARK = '#059669';
const ORANGE_COLOR = '#f59e0b';
const ORANGE_DARK = '#d97706';
const RED_COLOR = '#ef4444';
const RED_DARK = '#dc2626';
const GRAY_COLOR = '#6b7280';

const STATUS_CONFIG = {
    AVAILABLE: {
        label: 'Available',
        color: GREEN_COLOR,
        icon: <AvailableIcon fontSize="small" />,
        bgColor: alpha(GREEN_COLOR, 0.1),
    },
    IN_USE: {
        label: 'In Use',
        color: BLUE_COLOR,
        icon: <InUseIcon fontSize="small" />,
        bgColor: alpha(BLUE_COLOR, 0.1),
    },
    MAINTENANCE: {
        label: 'Maintenance',
        color: ORANGE_COLOR,
        icon: <MaintenanceIcon fontSize="small" />,
        bgColor: alpha(ORANGE_COLOR, 0.1),
    },
    OUT_OF_SERVICE: {
        label: 'Out of Service',
        color: RED_COLOR,
        icon: <OutOfServiceIcon fontSize="small" />,
        bgColor: alpha(RED_COLOR, 0.1),
    },
};

export const VehicleList = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [openForm, setOpenForm] = useState(false);
    const [openDetails, setOpenDetails] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [anchorEl, setAnchorEl] = useState(null);
    const [contextMenuVehicle, setContextMenuVehicle] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [vehicleToDelete, setVehicleToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    });
    const [updatingStatusId, setUpdatingStatusId] = useState(null);

    // Fetch vehicles with their issues
    const { data: vehiclesData = [], isLoading: isLoadingVehicles } = useQuery({
        queryKey: ['vehicles'],
        queryFn: async () => {
            const response = await axiosInstance.get('/vehicles');
            return response.data.vehicles || response.data.data || response.data;
        },
    });

    // Fetch vehicle issues separately
    const { data: vehicleIssues = [], isLoading: isLoadingIssues } = useQuery({
        queryKey: ['vehicle-issues-summary'],
        queryFn: async () => {
            const response = await axiosInstance.get('/vehicle-issues');
            console.log('Vehicle issues response:', response.data);
            return response.data.data || [];
        },
    });

    const { data: technicians = [] } = useQuery({
        queryKey: ['technicians'],
        queryFn: async () => {
            const response = await axiosInstance.get('/users/tech');
            return response.data.users || response.data.data || response.data || [];
        },
    });

    // Combine vehicle data with their issue counts
    const vehiclesWithIssues = React.useMemo(() => {
        if (!vehiclesData || !vehicleIssues) return [];

        return vehiclesData.map(vehicle => {
            const vehicleIssueData = vehicleIssues.filter(issue =>
                issue.vehicleId &&
                (issue.vehicleId._id === vehicle._id || issue.vehicleId === vehicle._id)
            );

            const openIssues = vehicleIssueData.filter(issue =>
                issue.status === 'OPEN' || issue.status === 'IN_PROGRESS'
            ).length;

            const totalIssues = vehicleIssueData.length;

            const latestIssue = vehicleIssueData.length > 0
                ? vehicleIssueData.sort((a, b) =>
                    new Date(b.reportedDate) - new Date(a.reportedDate)
                )[0]
                : null;

            return {
                ...vehicle,
                issues: vehicleIssueData,
                openIssueCount: openIssues,
                totalIssueCount: totalIssues,
                latestIssue: latestIssue,
                hasIssues: totalIssues > 0,
                isSafetyCritical: latestIssue?.isSafetyCritical || false,
                preventsDispatch: latestIssue?.preventsDispatch || false,
            };
        });
    }, [vehiclesData, vehicleIssues]);

    const deleteVehicleMutation = useMutation({
        mutationFn: async (vehicleId) => {
            const response = await axiosInstance.delete(`/vehicles/${vehicleId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            queryClient.invalidateQueries({ queryKey: ['vehicle-issues-summary'] });
            setOpenDeleteDialog(false);
            setVehicleToDelete(null);
            setSnackbar({
                open: true,
                message: 'Vehicle deleted successfully',
                severity: 'success',
            });
        },
        onError: (err) => {
            console.error('Failed to delete vehicle:', err);
            setSnackbar({
                open: true,
                message: 'Failed to delete vehicle',
                severity: 'error',
            });
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ vehicleId, status }) => {
            setUpdatingStatusId(vehicleId);
            try {
                const response = await axiosInstance.patch(`/vehicles/${vehicleId}/status`, { status });
                return response.data;
            } finally {
                setUpdatingStatusId(null);
            }
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            const newStatus = STATUS_CONFIG[variables.status]?.label || variables.status;
            setSnackbar({
                open: true,
                message: `Status changed to ${newStatus}`,
                severity: 'success',
            });
        },
        onError: (err, variables) => {
            console.error('Failed to update status:', err);
            setSnackbar({
                open: true,
                message: 'Failed to update status',
                severity: 'error',
            });
        },
    });

    const filteredVehicles = vehiclesWithIssues.filter(vehicle => {
        const matchesSearch = searchQuery === '' ||
            vehicle.truckNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vehicle.licensePlate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vehicle.vehicleType?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || vehicle.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleContextMenu = (event, vehicle) => {
        event.preventDefault();
        setAnchorEl(event.currentTarget);
        setContextMenuVehicle(vehicle);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        setContextMenuVehicle(null);
    };

    const handleStatusChange = (status) => {
        if (contextMenuVehicle) {
            updateStatusMutation.mutate({
                vehicleId: contextMenuVehicle._id,
                status
            });
        }
        handleCloseMenu();
    };

    const handleViewDetails = (vehicle) => {
        setSelectedVehicle(vehicle);
        setOpenDetails(true);
    };

    const handleEditVehicle = (vehicle) => {
        setSelectedVehicle(vehicle);
        setOpenForm(true);
    };

    const handleDeleteClick = (vehicle) => {
        setVehicleToDelete(vehicle);
        setOpenDeleteDialog(true);
    };

    const handleDeleteConfirm = () => {
        if (vehicleToDelete) {
            deleteVehicleMutation.mutate(vehicleToDelete._id);
        }
    };

    const getAssignedTechnician = (vehicle) => {
        if (!vehicle.assignedTechnicianId) return null;
        return technicians.find(t => t._id === vehicle.assignedTechnicianId);
    };

    const getVehicleIcon = (vehicleType) => {
        if (vehicleType?.toLowerCase().includes('pump')) return <TruckIcon />;
        if (vehicleType?.toLowerCase().includes('service')) return <ToolsIcon />;
        return <TruckIcon />;
    };

    const formatIssueSummary = (vehicle) => {
        if (!vehicle.hasIssues) return 'No issues';

        const criticalText = vehicle.isSafetyCritical ? 'Safety Critical' : '';
        const dispatchText = vehicle.preventsDispatch ? 'Prevents Dispatch' : '';

        return (
            <Box display="flex" flexDirection="column" gap={0.5}>
                <Box display="flex" alignItems="center" gap={1}>
                    <Badge badgeContent={vehicle.openIssueCount} color="error" sx={{
                        '& .MuiBadge-badge': {
                            backgroundColor: RED_COLOR,
                            color: 'white',
                            fontSize: '0.6rem',
                            minWidth: '16px',
                            height: '16px',
                        }
                    }}>
                        <WarningIcon sx={{ fontSize: 16, color: ORANGE_COLOR }} />
                    </Badge>
                    <Typography variant="caption" fontWeight={500}>
                        {vehicle.openIssueCount} active
                    </Typography>
                </Box>
                {(criticalText || dispatchText) && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        {criticalText}{criticalText && dispatchText ? ' • ' : ''}{dispatchText}
                    </Typography>
                )}
            </Box>
        );
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const isLoading = isLoadingVehicles || isLoadingIssues;

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress sx={{ color: BLUE_COLOR }} />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header Section */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography sx={{ fontSize: '1.25rem' }} fontWeight={600} gutterBottom>
                        Vehicle Fleet Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {vehiclesWithIssues.length} vehicles • {
                            vehiclesWithIssues.reduce((sum, v) => sum + v.openIssueCount, 0)
                        } active issues
                    </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={2}>
                    <Box display="flex" gap={1} alignItems="center">
                        <StyledTextField
                            placeholder="Search vehicles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: BLUE_COLOR }} />
                                    </InputAdornment>
                                ),
                            }}
                            size="small"
                            sx={{ width: 250 }}
                        />

                        <Box display="flex" gap={0.5}>
                            <Button
                                variant={statusFilter === 'ALL' ? 'contained' : 'outlined'}
                                onClick={() => setStatusFilter('ALL')}
                                size="small"
                                sx={{
                                    bgcolor: statusFilter === 'ALL' ? BLUE_COLOR : 'transparent',
                                    color: statusFilter === 'ALL' ? 'white' : BLUE_COLOR,
                                    borderColor: BLUE_COLOR,
                                    '&:hover': {
                                        bgcolor: statusFilter === 'ALL' ? BLUE_DARK : alpha(BLUE_COLOR, 0.1),
                                    },
                                }}
                            >
                                All
                            </Button>
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                <Tooltip key={key} title={config.label}>
                                    <Button
                                        variant={statusFilter === key ? 'contained' : 'outlined'}
                                        onClick={() => setStatusFilter(key)}
                                        size="small"
                                        sx={{
                                            minWidth: '40px',
                                            p: 1,
                                            bgcolor: statusFilter === key ? config.color : 'transparent',
                                            borderColor: config.color,
                                            color: statusFilter === key ? 'white' : config.color,
                                            '&:hover': {
                                                bgcolor: statusFilter === key ? config.color : alpha(config.color, 0.1),
                                            },
                                        }}
                                    >
                                        {React.cloneElement(config.icon, { fontSize: "small" })}
                                    </Button>
                                </Tooltip>
                            ))}
                        </Box>
                    </Box>

                    <GradientButton
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenForm(true)}
                    >
                        Add Vehicle
                    </GradientButton>
                </Box>
            </Box>

            {/* Statistics Summary */}
            <Box display="flex" gap={2} mb={3}>
                <Paper sx={{
                    p: 2,
                    flex: 1,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(BLUE_COLOR, 0.05)}, ${alpha(BLUE_DARK, 0.05)})`,
                    border: `1px solid ${alpha(BLUE_COLOR, 0.1)}`,
                }}>
                    <Typography variant="subtitle2" color="text.secondary">Total Vehicles</Typography>
                    <Typography variant="h4" fontWeight={700} color={BLUE_DARK}>{vehiclesWithIssues.length}</Typography>
                </Paper>
                <Paper sx={{
                    p: 2,
                    flex: 1,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(RED_COLOR, 0.05)}, ${alpha(RED_DARK, 0.05)})`,
                    border: `1px solid ${alpha(RED_COLOR, 0.1)}`,
                }}>
                    <Typography variant="subtitle2" color="text.secondary">Active Issues</Typography>
                    <Typography variant="h4" fontWeight={700} color={RED_DARK}>
                        {vehiclesWithIssues.reduce((sum, v) => sum + v.openIssueCount, 0)}
                    </Typography>
                </Paper>
                <Paper sx={{
                    p: 2,
                    flex: 1,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(ORANGE_COLOR, 0.05)}, ${alpha(ORANGE_DARK, 0.05)})`,
                    border: `1px solid ${alpha(ORANGE_COLOR, 0.1)}`,
                }}>
                    <Typography variant="subtitle2" color="text.secondary">In Maintenance</Typography>
                    <Typography variant="h4" fontWeight={700} color={ORANGE_DARK}>
                        {vehiclesWithIssues.filter(v => v.status === 'MAINTENANCE').length}
                    </Typography>
                </Paper>
                <Paper sx={{
                    p: 2,
                    flex: 1,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(RED_COLOR, 0.05)}, ${alpha('#9f1239', 0.05)})`,
                    border: `1px solid ${alpha(RED_COLOR, 0.1)}`,
                }}>
                    <Typography variant="subtitle2" color="text.secondary">Out of Service</Typography>
                    <Typography variant="h4" fontWeight={700} color={RED_DARK}>
                        {vehiclesWithIssues.filter(v => v.status === 'OUT_OF_SERVICE').length}
                    </Typography>
                </Paper>
            </Box>

            {/* Main Table */}
            <TableContainer
                component={Paper}
                elevation={1}
                sx={{
                    borderRadius: 2,
                    border: `1px solid ${alpha('#000', 0.08)}`,
                    overflow: 'hidden',
                }}
            >
                <Table>
                    <TableHead>
                        <TableRow sx={{
                            backgroundColor: alpha(BLUE_COLOR, 0.05),
                            '& th': {
                                borderBottom: `2px solid ${alpha(BLUE_COLOR, 0.2)}`,
                            }
                        }}>
                            <TableCell sx={{ fontWeight: 600, color: BLUE_DARK }}>Truck Info</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: BLUE_DARK }}>Details</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: BLUE_DARK }}>Assigned To</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: BLUE_DARK }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: BLUE_DARK }}>Issues</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: BLUE_DARK }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredVehicles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Box sx={{ textAlign: 'center', py: 3 }}>
                                        <TruckIcon sx={{ fontSize: 48, color: alpha('#000', 0.2), mb: 2 }} />
                                        <Typography color="text.secondary" gutterBottom>
                                            No vehicles found
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {searchQuery ? 'Try a different search term.' : 'Add your first vehicle to get started.'}
                                        </Typography>
                                        <GradientButton
                                            startIcon={<AddIcon />}
                                            onClick={() => setOpenForm(true)}
                                        >
                                            Add Vehicle
                                        </GradientButton>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredVehicles.map((vehicle) => {
                                const assignedTech = getAssignedTechnician(vehicle);
                                const statusConfig = STATUS_CONFIG[vehicle.status] || STATUS_CONFIG.AVAILABLE;
                                const isUpdating = updatingStatusId === vehicle._id;

                                return (
                                    <TableRow
                                        key={vehicle._id}
                                        hover
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: alpha(BLUE_COLOR, 0.03),
                                            },
                                            cursor: 'pointer',
                                            '&:last-child td': {
                                                borderBottom: 0,
                                            }
                                        }}
                                        onClick={() => handleViewDetails(vehicle)}
                                        onContextMenu={(e) => handleContextMenu(e, vehicle)}
                                    >
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 2,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: alpha(BLUE_COLOR, 0.1),
                                                        color: BLUE_DARK,
                                                        border: `1px solid ${alpha(BLUE_COLOR, 0.2)}`,
                                                    }}
                                                >
                                                    {getVehicleIcon(vehicle.vehicleType)}
                                                </Box>
                                                <Box>
                                                    <Typography fontWeight={600}>
                                                        {vehicle.truckNumber}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {vehicle.licensePlate}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {vehicle.vehicleType}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {vehicle.year} • {vehicle.make || ''} {vehicle.model || ''}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {assignedTech ? (
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Avatar
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            fontSize: '0.875rem',
                                                            bgcolor: BLUE_COLOR,
                                                        }}
                                                    >
                                                        {assignedTech.name?.charAt(0)}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2">
                                                            {assignedTech.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {assignedTech.role || 'Technician'}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    Unassigned
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isUpdating ? (
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <CircularProgress size={20} sx={{ color: BLUE_COLOR }} />
                                                    <Typography variant="caption" color="text.secondary">
                                                        Updating...
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                <Chip
                                                    label={statusConfig.label}
                                                    size="small"
                                                    icon={React.cloneElement(statusConfig.icon, { fontSize: "small" })}
                                                    sx={{
                                                        backgroundColor: statusConfig.bgColor,
                                                        color: statusConfig.color,
                                                        fontWeight: 500,
                                                        border: `1px solid ${alpha(statusConfig.color, 0.3)}`,
                                                        cursor: 'pointer',
                                                        '&:hover': {
                                                            backgroundColor: alpha(statusConfig.color, 0.2),
                                                        },
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setContextMenuVehicle(vehicle);
                                                        setAnchorEl(e.currentTarget);
                                                    }}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {vehicle.hasIssues ? (
                                                <Box
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewDetails(vehicle);
                                                    }}
                                                    sx={{
                                                        '&:hover': {
                                                            backgroundColor: alpha(RED_COLOR, 0.05),
                                                            borderRadius: 1,
                                                            cursor: 'pointer',
                                                        },
                                                        p: 0.5,
                                                    }}
                                                >
                                                    {formatIssueSummary(vehicle)}
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    No issues
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Quick Status Change">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setContextMenuVehicle(vehicle);
                                                        setAnchorEl(e.currentTarget);
                                                    }}
                                                    sx={{
                                                        color: BLUE_COLOR,
                                                        '&:hover': {
                                                            backgroundColor: alpha(BLUE_COLOR, 0.1),
                                                            transform: 'scale(1.1)',
                                                        },
                                                        transition: 'transform 0.2s',
                                                    }}
                                                    disabled={isUpdating}
                                                >
                                                    <RefreshIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Report Issue">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewDetails(vehicle);
                                                    }}
                                                    sx={{
                                                        color: ORANGE_COLOR,
                                                        '&:hover': {
                                                            backgroundColor: alpha(ORANGE_COLOR, 0.1),
                                                            transform: 'scale(1.1)',
                                                        },
                                                        transition: 'transform 0.2s',
                                                    }}
                                                >
                                                    <ReportIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditVehicle(vehicle);
                                                    }}
                                                    sx={{
                                                        color: BLUE_DARK,
                                                        '&:hover': {
                                                            backgroundColor: alpha(BLUE_DARK, 0.1),
                                                            transform: 'scale(1.1)',
                                                        },
                                                        transition: 'transform 0.2s',
                                                    }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="More Options">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleContextMenu(e, vehicle);
                                                    }}
                                                    sx={{
                                                        color: GRAY_COLOR,
                                                        '&:hover': {
                                                            backgroundColor: alpha(GRAY_COLOR, 0.1),
                                                            transform: 'scale(1.1)',
                                                        },
                                                        transition: 'transform 0.2s',
                                                    }}
                                                >
                                                    <MoreVertIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Status Change Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
                onClick={(e) => e.stopPropagation()}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        border: `1px solid ${alpha(BLUE_COLOR, 0.1)}`,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',

                    }
                }}
            >
                <MenuItem disabled sx={{ py: 1.5, backgroundColor: alpha(BLUE_COLOR, 0.05) }}>
                    <Typography variant="subtitle2" fontWeight={600} color={BLUE_DARK}>
                        {contextMenuVehicle?.truckNumber}
                    </Typography>
                </MenuItem>
                <MenuItem onClick={() => {
                    handleViewDetails(contextMenuVehicle);
                    handleCloseMenu();
                }} sx={{ '&:hover': { backgroundColor: alpha(BLUE_COLOR, 0.1) }, fontSize: '0.875rem' }}>
                    <PersonIcon fontSize="small" sx={{ mr: 1, color: BLUE_COLOR }} />
                    View Details
                </MenuItem>
                <MenuItem onClick={() => {
                    handleEditVehicle(contextMenuVehicle);
                    handleCloseMenu();
                }} sx={{ '&:hover': { backgroundColor: alpha(BLUE_DARK, 0.1) }, fontSize: '0.875rem' }}>
                    <EditIcon fontSize="small" sx={{ mr: 1, color: BLUE_DARK }} />
                    Edit Vehicle
                </MenuItem>
                <MenuItem disabled sx={{ borderTop: '1px solid #e0e0e0', mt: 1, py: 1, backgroundColor: alpha(GRAY_COLOR, 0.05), fontSize: '0.875rem' }}>
                    <Typography variant="caption" color="text.secondary">
                        QUICK STATUS CHANGE:
                    </Typography>
                </MenuItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <MenuItem
                        key={key}
                        onClick={() => {
                            handleStatusChange(key);
                            handleCloseMenu();
                        }}
                        sx={{
                            color: config.color,
                            '&:hover': { backgroundColor: alpha(config.color, 0.1) },
                            py: 1.5,
                            fontSize: '0.875rem'
                        }}
                        disabled={contextMenuVehicle?.status === key || updatingStatusId === contextMenuVehicle?._id}
                    >
                        <Box display="flex" alignItems="center" gap={2} width="100%">
                            {React.cloneElement(config.icon, { fontSize: "medium" })}
                            <Box flex={1}>
                                <Typography sx={{ fontSize: '0.875rem' }}>{config.label}</Typography>
                                {contextMenuVehicle?.status === key && (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                        Current Status
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </MenuItem>
                ))}
                <MenuItem
                    onClick={() => {
                        handleDeleteClick(contextMenuVehicle);
                        handleCloseMenu();
                    }}
                    sx={{
                        color: RED_COLOR,
                        '&:hover': { backgroundColor: alpha(RED_COLOR, 0.1) },
                        borderTop: '1px solid #e0e0e0',
                        mt: 1,
                        fontSize: '0.875rem'
                    }}
                >
                    <Box display="flex" alignItems="center" gap={1}>
                        <DeleteIcon fontSize="small" />
                        Delete Vehicle
                    </Box>
                </MenuItem>
            </Menu>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        border: `1px solid ${alpha(RED_COLOR, 0.1)}`,
                    }
                }}
            >
                <DialogTitle sx={{
                    background: `linear-gradient(135deg, ${alpha(RED_COLOR, 0.1)}, ${alpha(RED_DARK, 0.1)})`,
                    color: RED_DARK,
                    fontWeight: 600,
                    borderBottom: `1px solid ${alpha(RED_COLOR, 0.2)}`,
                }}>
                    <WarningIcon sx={{ mr: 1, fontSize: 24 }} />
                    Confirm Delete
                </DialogTitle>
                <DialogContent sx={{ py: 3 }}>
                    <Typography variant="body1" gutterBottom>
                        Are you sure you want to delete vehicle:
                    </Typography>
                    <Box sx={{
                        p: 2,
                        bgcolor: alpha(RED_COLOR, 0.05),
                        borderRadius: 1,
                        border: `1px solid ${alpha(RED_COLOR, 0.1)}`,
                        my: 2,
                    }}>
                        <Typography variant="h6" fontWeight={600} color={RED_DARK}>
                            {vehicleToDelete?.truckNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {vehicleToDelete?.licensePlate} • {vehicleToDelete?.vehicleType}
                        </Typography>
                    </Box>
                    <Alert severity="error" sx={{ mt: 2 }}>
                        This action cannot be undone. All associated data will be permanently deleted.
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <OutlineButton onClick={() => setOpenDeleteDialog(false)}>
                        Cancel
                    </OutlineButton>
                    <Button
                        variant="contained"
                        sx={{
                            background: `linear-gradient(135deg, ${RED_COLOR}, ${RED_DARK})`,
                            color: 'white',
                            fontWeight: 600,
                            '&:hover': {
                                background: `linear-gradient(135deg, ${RED_DARK}, #b91c1c)`,
                                boxShadow: `0 4px 12px ${alpha(RED_COLOR, 0.4)}`,
                            },
                            boxShadow: `0 2px 8px ${alpha(RED_COLOR, 0.3)}`,
                        }}
                        onClick={handleDeleteConfirm}
                        disabled={deleteVehicleMutation.isPending}
                        startIcon={deleteVehicleMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
                    >
                        {deleteVehicleMutation.isPending ? 'Deleting...' : 'Delete Vehicle'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{
                        width: '100%',
                        borderRadius: 2,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    }}
                    iconMapping={{
                        success: <CheckIcon />,
                        error: <WarningIcon />,
                        warning: <WarningIcon />,
                        info: <InfoIcon />,
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Dialogs */}
            <VehicleForm
                open={openForm}
                onClose={() => {
                    setOpenForm(false);
                    setSelectedVehicle(null);
                }}
                vehicle={selectedVehicle}
                technicians={technicians}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                    queryClient.invalidateQueries({ queryKey: ['vehicle-issues-summary'] });
                }}
            />

            <VehicleDetails
                open={openDetails}
                onClose={() => {
                    setOpenDetails(false);
                    setSelectedVehicle(null);
                }}
                vehicle={selectedVehicle}
                technicians={technicians}
                onRefresh={() => {
                    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                    queryClient.invalidateQueries({ queryKey: ['vehicle-issues-summary'] });
                }}
            />
        </Box>
    );
};

export default VehicleList;