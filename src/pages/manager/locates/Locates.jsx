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
    Chip,
    Button,
    TextField,
    InputAdornment,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Menu,
    Snackbar,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    Tabs,
    Tab,
    Avatar,
    Badge,
    Divider,
    Stack,
    useTheme,
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    LocationOn as LocationIcon,
    Person as PersonIcon,
    CalendarToday as CalendarIcon,
    Assignment as AssignmentIcon,
    CheckCircle as CheckIcon,
    Pending as PendingIcon,
    Warning as WarningIcon,
    MoreVert as MoreVertIcon,
    LocalShipping as TruckIcon,
    Business as BusinessIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Notes as NotesIcon,
    Schedule as ScheduleIcon,
    Archive as ArchiveIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon,
    ArrowRightAlt as ArrowRightIcon,
    NoteAdd as NoteAddIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import GradientButton from '../../../components/ui/GradientButton';
import OutlineButton from '../../../components/ui/OutlineButton';
import StyledTextField from '../../../components/ui/StyledTextField';
import { alpha } from '@mui/material/styles';
import axiosInstance from '../../../api/axios';
import { format } from 'date-fns';

const BLUE_COLOR = '#76AADA';
const BLUE_DARK = '#5A8FC8';
const GREEN_COLOR = '#10b981';
const GREEN_DARK = '#059669';
const ORANGE_COLOR = '#f59e0b';
const ORANGE_DARK = '#d97706';
const RED_COLOR = '#ef4444';
const RED_DARK = '#dc2626';
const PURPLE_COLOR = '#8b5cf6';
const PURPLE_DARK = '#7c3aed';
const GRAY_COLOR = '#6b7280';
const GRAY_DARK = '#4b5563';

const LOCATE_TYPE_CONFIG = {
    STANDARD: {
        label: 'Standard',
        color: BLUE_COLOR,
        bgColor: alpha(BLUE_COLOR, 0.1),
        icon: <AssignmentIcon />,
    },
    EMERGENCY: {
        label: 'Emergency',
        color: RED_COLOR,
        bgColor: alpha(RED_COLOR, 0.1),
        icon: <WarningIcon />,
    },
};

const STATUS_CONFIG = {
    NEW: {
        label: 'New',
        color: ORANGE_COLOR,
        bgColor: alpha(ORANGE_COLOR, 0.1),
        icon: <PendingIcon />,
        tableBg: alpha(ORANGE_COLOR, 0.03),
        headerBg: alpha(ORANGE_COLOR, 0.1),
    },
    IN_PROGRESS: {
        label: 'In Progress',
        color: BLUE_DARK,
        bgColor: alpha(BLUE_COLOR, 0.1),
        icon: <LocationIcon />,
        tableBg: alpha(BLUE_COLOR, 0.03),
        headerBg: alpha(BLUE_COLOR, 0.1),
    },
    COMPLETED: {
        label: 'Completed',
        color: GREEN_COLOR,
        bgColor: alpha(GREEN_COLOR, 0.1),
        icon: <CheckIcon />,
        tableBg: alpha(GREEN_COLOR, 0.03),
        headerBg: alpha(GREEN_COLOR, 0.1),
    },
    CANCELLED: {
        label: 'Cancelled',
        color: RED_COLOR,
        bgColor: alpha(RED_COLOR, 0.1),
        icon: <ArchiveIcon />,
        tableBg: alpha(RED_COLOR, 0.03),
        headerBg: alpha(RED_COLOR, 0.1),
    },
};

const Locates = () => {
    const queryClient = useQueryClient();
    const theme = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('ALL');
    const [openForm, setOpenForm] = useState(false);
    const [selectedLocate, setSelectedLocate] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [contextMenuLocate, setContextMenuLocate] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [locateToDelete, setLocateToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
    });
    const [activeTab, setActiveTab] = useState(0);

    const [locateForm, setLocateForm] = useState({
        jobId: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        description: '',
        type: 'STANDARD',
        requestedBy: '',
        requestedDate: new Date().toISOString().split('T')[0],
        expectedExcavationDate: '',
        notes: '',
        customerName: '',
        siteAddress: '',
        technician: '',
        calledInBy: '',
    });

    const { data: locates = [], isLoading } = useQuery({
        queryKey: ['locates'],
        queryFn: async () => {
            const response = await axiosInstance.get('/locates');
            console.log('Locates response:', response.data);
            return response.data.data || response.data.locates || response.data;
        },
    });

    const { data: technicians = [] } = useQuery({
        queryKey: ['technicians'],
        queryFn: async () => {
            const response = await axiosInstance.get('/users/tech');
            return response.data.users || response.data.data || response.data || [];
        },
    });

    const { data: managers = [] } = useQuery({
        queryKey: ['managers'],
        queryFn: async () => {
            const response = await axiosInstance.get('/users/manager');
            return response.data.users || response.data.data || response.data || [];
        },
    });

    const createLocateMutation = useMutation({
        mutationFn: async (locateData) => {
            const response = await axiosInstance.post('/locates', locateData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locates'] });
            setOpenForm(false);
            resetLocateForm();
            setSnackbar({
                open: true,
                message: 'Locate created successfully',
                severity: 'success',
            });
        },
        onError: (error) => {
            console.error('Error creating locate:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to create locate',
                severity: 'error',
            });
        },
    });

    const updateLocateMutation = useMutation({
        mutationFn: async ({ locateId, data }) => {
            const response = await axiosInstance.put(`/locates/${locateId}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locates'] });
            setOpenForm(false);
            setSelectedLocate(null);
            setSnackbar({
                open: true,
                message: 'Locate updated successfully',
                severity: 'success',
            });
        },
        onError: (error) => {
            console.error('Error updating locate:', error);
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to update locate',
                severity: 'error',
            });
        },
    });

    const deleteLocateMutation = useMutation({
        mutationFn: async (locateId) => {
            const response = await axiosInstance.delete(`/locates/${locateId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locates'] });
            setOpenDeleteDialog(false);
            setLocateToDelete(null);
            setSnackbar({
                open: true,
                message: 'Locate deleted successfully',
                severity: 'success',
            });
        },
        onError: (error) => {
            console.error('Error deleting locate:', error);
            setSnackbar({
                open: true,
                message: 'Failed to delete locate',
                severity: 'error',
            });
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ locateId, status }) => {
            const response = await axiosInstance.patch(`/locates/${locateId}/status`, { status });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locates'] });
            setSnackbar({
                open: true,
                message: 'Status updated successfully',
                severity: 'success',
            });
        },
        onError: (error) => {
            console.error('Error updating status:', error);
            setSnackbar({
                open: true,
                message: 'Failed to update status',
                severity: 'error',
            });
        },
    });

    const filteredLocates = locates.filter(locate => {
        const matchesSearch = searchQuery === '' ||
            locate.jobId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            locate.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            locate.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            locate.description?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || locate.status === statusFilter;
        const matchesType = typeFilter === 'ALL' || locate.type === typeFilter;

        let matchesDate = true;
        if (dateFilter !== 'ALL') {
            const today = new Date();
            const locateDate = new Date(locate.requestedDate);

            switch (dateFilter) {
                case 'TODAY':
                    matchesDate = locateDate.toDateString() === today.toDateString();
                    break;
                case 'THIS_WEEK':
                    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
                    matchesDate = locateDate >= weekStart;
                    break;
                case 'THIS_MONTH':
                    matchesDate = locateDate.getMonth() === today.getMonth() &&
                        locateDate.getFullYear() === today.getFullYear();
                    break;
                default:
                    matchesDate = true;
            }
        }

        return matchesSearch && matchesStatus && matchesType && matchesDate;
    });

    const newLocates = filteredLocates.filter(l => l.status === 'NEW');
    const inProgressLocates = filteredLocates.filter(l => l.status === 'IN_PROGRESS');
    const completedLocates = filteredLocates.filter(l => l.status === 'COMPLETED');

    const getTechnicianName = (technicianId) => {
        const tech = technicians.find(t => t._id === technicianId);
        return tech ? tech.name : 'Unassigned';
    };

    const getManagerName = (managerId) => {
        const manager = managers.find(m => m._id === managerId);
        return manager ? manager.name : 'Unknown';
    };

    const handleContextMenu = (event, locate) => {
        event.preventDefault();
        setAnchorEl(event.currentTarget);
        setContextMenuLocate(locate);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        setContextMenuLocate(null);
    };

    const handleStatusChange = (status) => {
        if (contextMenuLocate) {
            updateStatusMutation.mutate({
                locateId: contextMenuLocate._id,
                status
            });
        }
        handleCloseMenu();
    };

    const handleEditLocate = (locate) => {
        setSelectedLocate(locate);
        setLocateForm({
            jobId: locate.jobId || '',
            address: locate.address || '',
            city: locate.city || '',
            state: locate.state || '',
            zip: locate.zip || '',
            description: locate.description || '',
            type: locate.type || 'STANDARD',
            requestedBy: locate.requestedBy || '',
            requestedDate: locate.requestedDate ?
                format(new Date(locate.requestedDate), 'yyyy-MM-dd') :
                new Date().toISOString().split('T')[0],
            expectedExcavationDate: locate.expectedExcavationDate ?
                format(new Date(locate.expectedExcavationDate), 'yyyy-MM-dd') : '',
            notes: locate.notes || '',
            customerName: locate.customerName || '',
            siteAddress: locate.siteAddress || '',
            technician: locate.technician || '',
            calledInBy: locate.calledInBy || '',
        });
        setOpenForm(true);
    };

    const handleDeleteClick = (locate) => {
        setLocateToDelete(locate);
        setOpenDeleteDialog(true);
    };

    const handleDeleteConfirm = () => {
        if (locateToDelete) {
            deleteLocateMutation.mutate(locateToDelete._id);
        }
    };

    const resetLocateForm = () => {
        setLocateForm({
            jobId: '',
            address: '',
            city: '',
            state: '',
            zip: '',
            description: '',
            type: 'STANDARD',
            requestedBy: '',
            requestedDate: new Date().toISOString().split('T')[0],
            expectedExcavationDate: '',
            notes: '',
            customerName: '',
            siteAddress: '',
            technician: '',
            calledInBy: '',
        });
        setSelectedLocate(null);
    };

    const handleSubmitLocate = () => {
        const formData = {
            ...locateForm,
            requestedDate: new Date(locateForm.requestedDate).toISOString(),
            expectedExcavationDate: locateForm.expectedExcavationDate ?
                new Date(locateForm.expectedExcavationDate).toISOString() : null,
        };

        if (selectedLocate) {
            updateLocateMutation.mutate({
                locateId: selectedLocate._id,
                data: formData
            });
        } else {
            createLocateMutation.mutate(formData);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'MMM dd, yyyy');
        } catch (error) {
            return dateString;
        }
    };

    const renderStatusTable = (status, locates, title, config) => (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 2,
                border: `1px solid ${alpha(config.color, 0.2)}`,
                overflow: 'hidden',
                mb: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
        >
            {/* Table Header */}
            <Box sx={{
                p: 1.5,
                borderBottom: `2px solid ${config.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <Typography sx={{ fontSize: '0.875rem' }} fontWeight={600} color={config.color}>
                        {title}
                    </Typography>
                    <Chip
                        label={locates.length}
                        size="small"
                        sx={{
                            backgroundColor: alpha(config.color, 0.2),
                            color: config.color,
                            fontWeight: 600,
                        }}
                    />
                </Box>
                <Typography variant="caption" sx={{ color: alpha(config.color, 0.8) }}>
                    {status === 'NEW' ? 'Call Needed' : status === 'IN_PROGRESS' ? 'In Progress' : 'Locates Complete'}
                </Typography>
            </Box>

            {/* Table Content */}
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow sx={{
                            backgroundColor: alpha(config.color, 0.05),
                            '& th': {
                                borderBottom: `2px solid ${alpha(config.color, 0.2)}`,
                                fontWeight: 600,
                                color: config.color,
                                textTransform: 'capitalize',
                            }
                        }}>
                            {status === 'NEW' ? (
                                <>
                                    <TableCell width="15%">Locate Type</TableCell>
                                    <TableCell width="25%">Customer Name</TableCell>
                                    <TableCell width="25%">Site Address</TableCell>
                                    <TableCell width="15%">Date</TableCell>
                                    <TableCell width="15%">Technician</TableCell>
                                    <TableCell width="5%">Actions</TableCell>
                                </>
                            ) : status === 'IN_PROGRESS' ? (
                                <>
                                    <TableCell width="15%">Locate Type</TableCell>
                                    <TableCell width="20%">Customer Name</TableCell>
                                    <TableCell width="20%">Site Address</TableCell>
                                    <TableCell width="15%">Date</TableCell>
                                    <TableCell width="15%">Technician</TableCell>
                                    <TableCell width="10%">Called In By</TableCell>
                                    <TableCell width="5%">Actions</TableCell>
                                </>
                            ) : (
                                <>
                                    <TableCell width="15%">Locate Type</TableCell>
                                    <TableCell width="20%">Customer Name</TableCell>
                                    <TableCell width="20%">Site Address</TableCell>
                                    <TableCell width="15%">Date</TableCell>
                                    <TableCell width="15%">Technician</TableCell>
                                    <TableCell width="10%">Called In By</TableCell>
                                    <TableCell width="5%">Actions</TableCell>
                                </>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {locates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={
                                    status === 'NEW' ? 6 :
                                        status === 'IN_PROGRESS' ? 7 :
                                            7
                                } align="center" sx={{ py: 4 }}>
                                    <Box sx={{ textAlign: 'center', py: 2 }}>
                                        <NoteAddIcon sx={{ fontSize: 48, color: alpha(GRAY_COLOR, 0.3), mb: 2 }} />
                                        <Typography color="text.secondary" gutterBottom>
                                            No locates in this section
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {status === 'NEW' ? 'New locate requests will appear here.' :
                                                status === 'IN_PROGRESS' ? 'Assign technicians to move locates here.' :
                                                    'Completed locates will appear here.'}
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            locates.map((locate) => {
                                const typeConfig = LOCATE_TYPE_CONFIG[locate.type] || LOCATE_TYPE_CONFIG.STANDARD;

                                return (
                                    <TableRow
                                        key={locate._id}
                                        hover
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: alpha(config.color, 0.03),
                                            },
                                            '&:last-child td': {
                                                borderBottom: 'none',
                                            }
                                        }}
                                    >
                                        {/* Locate Type - All Tables */}
                                        <TableCell>
                                            <Chip
                                                label={typeConfig.label}
                                                size="small"
                                                icon={React.cloneElement(typeConfig.icon, { fontSize: 'small' })}
                                                sx={{
                                                    backgroundColor: typeConfig.bgColor,
                                                    color: typeConfig.color,
                                                    fontWeight: 500,
                                                    border: `1px solid ${alpha(typeConfig.color, 0.3)}`,
                                                }}
                                            />
                                        </TableCell>

                                        {/* Customer Name - All Tables */}
                                        <TableCell>
                                            <Typography fontWeight={500}>
                                                {locate.customerName || 'No Customer'}
                                            </Typography>
                                        </TableCell>

                                        {/* Site Address - All Tables */}
                                        <TableCell>
                                            <Typography variant="body2">
                                                {locate.address || 'No Address'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {locate.city}, {locate.state} {locate.zip}
                                            </Typography>
                                        </TableCell>

                                        {/* Date - All Tables */}
                                        <TableCell>
                                            <Stack spacing={0.5}>
                                                <Typography variant="body2">
                                                    {formatDate(locate.requestedDate)}
                                                </Typography>
                                                {locate.expectedExcavationDate && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Exc: {formatDate(locate.expectedExcavationDate)}
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </TableCell>

                                        {/* Technician - All Tables */}
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Avatar
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        fontSize: '0.875rem',
                                                        bgcolor: status === 'COMPLETED' ? GREEN_COLOR :
                                                            status === 'IN_PROGRESS' ? BLUE_COLOR :
                                                                ORANGE_COLOR,
                                                        color: 'white',
                                                    }}
                                                >
                                                    {getTechnicianName(locate.technician).charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2">
                                                        {getTechnicianName(locate.technician)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        {/* Called In By - Only for IN_PROGRESS and COMPLETED */}
                                        {status !== 'NEW' && (
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {locate.calledInBy || 'No caller info'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {status === 'COMPLETED' ?
                                                        `Completed on: ${formatDate(locate.completedAt || new Date().toISOString())}` :
                                                        `Requested by: ${locate.requestedBy || 'Unknown'}`
                                                    }
                                                </Typography>
                                            </TableCell>
                                        )}

                                        {/* Actions - All Tables */}
                                        <TableCell>
                                            <Box display="flex" gap={1}>
                                                {status === 'NEW' && (
                                                    <Tooltip title="Start Work">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => updateStatusMutation.mutate({
                                                                locateId: locate._id,
                                                                status: 'IN_PROGRESS'
                                                            })}
                                                            sx={{
                                                                color: BLUE_COLOR,
                                                                backgroundColor: alpha(BLUE_COLOR, 0.1),
                                                                '&:hover': {
                                                                    backgroundColor: alpha(BLUE_COLOR, 0.2),
                                                                },
                                                            }}
                                                        >
                                                            <ArrowRightIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {status === 'IN_PROGRESS' && (
                                                    <Tooltip title="Mark Complete">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => updateStatusMutation.mutate({
                                                                locateId: locate._id,
                                                                status: 'COMPLETED'
                                                            })}
                                                            sx={{
                                                                color: GREEN_COLOR,
                                                                backgroundColor: alpha(GREEN_COLOR, 0.1),
                                                                '&:hover': {
                                                                    backgroundColor: alpha(GREEN_COLOR, 0.2),
                                                                },
                                                            }}
                                                        >
                                                            <CheckIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <Tooltip title="Edit">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleEditLocate(locate)}
                                                        sx={{
                                                            color: ORANGE_COLOR,
                                                            '&:hover': {
                                                                backgroundColor: alpha(ORANGE_COLOR, 0.1),
                                                            },
                                                        }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeleteClick(locate)}
                                                        sx={{
                                                            color: RED_COLOR,
                                                            '&:hover': {
                                                                backgroundColor: alpha(RED_COLOR, 0.1),
                                                            },
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );

    // if (isLoading) {
    //     return (
    //         <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
    //             <CircularProgress sx={{ color: BLUE_COLOR }} />
    //         </Box>
    //     );
    // }

    return (
        <Box>
            {/* Header Section */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography
                        sx={{
                            fontWeight: 'bold',
                            mb: 0.5,
                            fontSize: 20,
                            background: `linear-gradient(135deg, ${BLUE_DARK} 0%, ${BLUE_COLOR} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                        gutterBottom
                    >
                        Locate Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage utility locates and excavation requests
                    </Typography>
                </Box>

                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Box display="flex" gap={1} flexWrap="wrap">

                            <Box display="flex" gap={1}>
                                <StyledTextField
                                    placeholder="Search by job, address, or customer..."
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
                                    sx={{ width: { xs: '100%', sm: 300 } }}
                                />
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        label="Status"
                                        sx={{ fontWeight: 500, fontSize: '0.875rem' }}
                                    >
                                        <MenuItem sx={{ fontWeight: 500, fontSize: '0.875rem' }} value="ALL">All Status</MenuItem>
                                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                            <MenuItem sx={{ fontWeight: 500, fontSize: '0.875rem' }} key={key} value={key}>
                                                {config.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        label="Type"
                                        sx={{ fontWeight: 500, fontSize: '0.875rem' }}
                                    >
                                        <MenuItem sx={{ fontWeight: 500, fontSize: '0.875rem' }} value="ALL">All Types</MenuItem>
                                        {Object.entries(LOCATE_TYPE_CONFIG).map(([key, config]) => (
                                            <MenuItem sx={{ fontWeight: 500, fontSize: '0.875rem' }} key={key} value={key}>
                                                {config.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>Date</InputLabel>
                                    <Select
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value)}
                                        label="Date"
                                        sx={{ fontWeight: 500, fontSize: '0.875rem' }}
                                    >
                                        <MenuItem sx={{ fontWeight: 500, fontSize: '0.875rem' }} value="ALL">All Dates</MenuItem>
                                        <MenuItem sx={{ fontWeight: 500, fontSize: '0.875rem' }} value="TODAY">Today</MenuItem>
                                        <MenuItem sx={{ fontWeight: 500, fontSize: '0.875rem' }} value="THIS_WEEK">This Week</MenuItem>
                                        <MenuItem sx={{ fontWeight: 500, fontSize: '0.875rem' }} value="THIS_MONTH">This Month</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box display="flex" justifyContent="flex-end">
                            <GradientButton
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => {
                                    resetLocateForm();
                                    setOpenForm(true);
                                }}
                            >
                                Create Locate
                            </GradientButton>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            {/* Three Section Tables - With Different Columns */}
            {renderStatusTable('NEW', newLocates, 'Call Needed', STATUS_CONFIG.NEW)}
            {renderStatusTable('IN_PROGRESS', inProgressLocates, 'In Progress', STATUS_CONFIG.IN_PROGRESS)}
            {renderStatusTable('COMPLETED', completedLocates, 'Locates Complete', STATUS_CONFIG.COMPLETED)}

            {/* Create/Edit Locate Dialog */}
            <Dialog
                open={openForm}
                onClose={() => {
                    setOpenForm(false);
                    setSelectedLocate(null);
                }}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        border: `1px solid ${alpha(BLUE_COLOR, 0.1)}`,
                    }
                }}
            >
                <DialogTitle sx={{
                    pb: 2,
                    background: `linear-gradient(135deg, ${BLUE_COLOR} 0%, ${BLUE_DARK} 100%)`,
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <Typography variant="h6" fontWeight={600}>
                        {selectedLocate ? 'Edit Locate' : 'Create New Locate'}
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ mt: 3 }}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Job/Work Order ID (Optional)"
                                value={locateForm.jobId}
                                onChange={(e) => setLocateForm({ ...locateForm, jobId: e.target.value })}
                                size="small"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth size="small" required>
                                <InputLabel>Locate Type</InputLabel>
                                <Select
                                    value={locateForm.type}
                                    onChange={(e) => setLocateForm({ ...locateForm, type: e.target.value })}
                                    label="Locate Type"
                                >
                                    {Object.entries(LOCATE_TYPE_CONFIG).map(([key, config]) => (
                                        <MenuItem key={key} value={key}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                {React.cloneElement(config.icon, { sx: { fontSize: 18 } })}
                                                {config.label}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Location Information
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Address"
                                value={locateForm.address}
                                onChange={(e) => setLocateForm({ ...locateForm, address: e.target.value })}
                                size="small"
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                label="City"
                                value={locateForm.city}
                                onChange={(e) => setLocateForm({ ...locateForm, city: e.target.value })}
                                size="small"
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                label="State"
                                value={locateForm.state}
                                onChange={(e) => setLocateForm({ ...locateForm, state: e.target.value })}
                                size="small"
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                label="ZIP Code"
                                value={locateForm.zip}
                                onChange={(e) => setLocateForm({ ...locateForm, zip: e.target.value })}
                                size="small"
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Customer Name"
                                value={locateForm.customerName}
                                onChange={(e) => setLocateForm({ ...locateForm, customerName: e.target.value })}
                                size="small"
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Site Address"
                                value={locateForm.siteAddress}
                                onChange={(e) => setLocateForm({ ...locateForm, siteAddress: e.target.value })}
                                size="small"
                                required
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Description of Work"
                                multiline
                                rows={3}
                                value={locateForm.description}
                                onChange={(e) => setLocateForm({ ...locateForm, description: e.target.value })}
                                size="small"
                                required
                                placeholder="Describe the excavation work needed..."
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Requested By"
                                value={locateForm.requestedBy}
                                onChange={(e) => setLocateForm({ ...locateForm, requestedBy: e.target.value })}
                                size="small"
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonIcon sx={{ color: BLUE_COLOR, fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Called In By"
                                value={locateForm.calledInBy}
                                onChange={(e) => setLocateForm({ ...locateForm, calledInBy: e.target.value })}
                                size="small"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PhoneIcon sx={{ color: BLUE_COLOR, fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Requested Date"
                                type="date"
                                value={locateForm.requestedDate}
                                onChange={(e) => setLocateForm({ ...locateForm, requestedDate: e.target.value })}
                                size="small"
                                required
                                InputLabelProps={{ shrink: true }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CalendarIcon sx={{ color: BLUE_COLOR, fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Expected Excavation Date"
                                type="date"
                                value={locateForm.expectedExcavationDate}
                                onChange={(e) => setLocateForm({ ...locateForm, expectedExcavationDate: e.target.value })}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <ScheduleIcon sx={{ color: BLUE_COLOR, fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Assign Technician</InputLabel>
                                <Select
                                    value={locateForm.technician}
                                    onChange={(e) => setLocateForm({ ...locateForm, technician: e.target.value })}
                                    label="Assign Technician"
                                >
                                    <MenuItem value="">Unassigned</MenuItem>
                                    {technicians.map(tech => (
                                        <MenuItem key={tech._id} value={tech._id}>
                                            {tech.name} ({tech.employeeId || 'No ID'})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Notes (Optional)"
                                multiline
                                rows={2}
                                value={locateForm.notes}
                                onChange={(e) => setLocateForm({ ...locateForm, notes: e.target.value })}
                                size="small"
                                placeholder="Additional notes or instructions..."
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <OutlineButton onClick={() => {
                        setOpenForm(false);
                        setSelectedLocate(null);
                    }}>
                        Cancel
                    </OutlineButton>
                    <GradientButton
                        onClick={handleSubmitLocate}
                        disabled={!locateForm.address || !locateForm.city || !locateForm.state || !locateForm.zip || !locateForm.description}
                        loading={createLocateMutation.isPending || updateLocateMutation.isPending}
                    >
                        {selectedLocate ? 'Update Locate' : 'Create Locate'}
                    </GradientButton>
                </DialogActions>
            </Dialog>

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
                        Are you sure you want to delete this locate?
                    </Typography>
                    <Box sx={{
                        p: 2,
                        bgcolor: alpha(RED_COLOR, 0.05),
                        borderRadius: 1,
                        border: `1px solid ${alpha(RED_COLOR, 0.1)}`,
                        my: 2,
                    }}>
                        <Typography variant="h6" fontWeight={600} color={RED_DARK}>
                            {locateToDelete?.jobId || 'No Job ID'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {locateToDelete?.address}, {locateToDelete?.city}, {locateToDelete?.state}
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
                        disabled={deleteLocateMutation.isPending}
                        startIcon={deleteLocateMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
                    >
                        {deleteLocateMutation.isPending ? 'Deleting...' : 'Delete Locate'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{
                        width: '100%',
                        borderRadius: 2,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Locates;